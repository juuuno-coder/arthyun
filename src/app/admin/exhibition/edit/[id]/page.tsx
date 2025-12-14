// src/app/admin/exhibition/edit/[id]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dynamicImport from "next/dynamic";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

// Editor를 동적으로 import (SSR 방지)
const Editor = dynamicImport(() => import("@/components/Editor"), {
    ssr: false,
    loading: () => <div className="min-h-[200px] border rounded-md p-4 flex items-center justify-center text-gray-400">에디터 로딩 중...</div>
});

// 정적 생성 방지 (클라이언트 전용 컴포넌트)
export const dynamic = "force-dynamic";

export default function EditExhibitionPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params); // Next.js 16: params를 unwrap
    const [descHtml, setDescHtml] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [exhibition, setExhibition] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadExhibition() {
            const { data, error } = await supabase
                .from("exhibitions")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                alert("전시 정보를 불러올 수 없습니다.");
                router.push("/admin/exhibition");
                return;
            }

            setExhibition(data);
            setDescHtml(data.description || "");
            setLoading(false);
        }

        loadExhibition();
    }, [id, router]);

    // 이미지 삭제 함수
    const handleDeleteImage = async () => {
        if (!confirm("이미지를 삭제하시겠습니까?")) return;

        const { error } = await supabase
            .from("exhibitions")
            .update({ poster_url: null })
            .eq("id", id);

        if (error) {
            alert("이미지 삭제 실패");
            return;
        }

        setExhibition({ ...exhibition, poster_url: null });
        alert("이미지가 삭제되었습니다.");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const imageFile = formData.get("poster") as File;

        let poster_url = exhibition.poster_url;

        // 새 이미지가 업로드된 경우
        if (imageFile && imageFile.size > 0) {
            // 기존 이미지가 있으면 Storage에서 삭제
            if (exhibition.poster_url) {
                try {
                    // URL에서 파일명 추출 (전체 경로에서 마지막 부분만)
                    const urlParts = exhibition.poster_url.split('/');
                    const oldFileName = urlParts[urlParts.length - 1];

                    // 쿼리 파라미터 제거 (예: ?token=xxx)
                    const cleanFileName = oldFileName.split('?')[0];

                    if (cleanFileName && cleanFileName !== 'null' && cleanFileName !== 'undefined') {
                        await supabase.storage
                            .from("posters")
                            .remove([cleanFileName]);
                    }
                } catch (error) {
                    console.error("기존 이미지 삭제 실패:", error);
                    // 삭제 실패해도 계속 진행
                }
            }

            // 새 이미지 업로드
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("posters")
                .upload(fileName, imageFile);

            if (uploadError) {
                console.error("업로드 에러:", uploadError);
                alert(`이미지 업로드 실패: ${uploadError.message}`);
                setIsLoading(false);
                return;
            }

            const { data: urlData } = supabase.storage
                .from("posters")
                .getPublicUrl(fileName);
            poster_url = urlData.publicUrl;
        }

        const { error } = await supabase
            .from("exhibitions")
            .update({
                title: formData.get("title") as string,
                artist: formData.get("artist") as string,
                start_date: formData.get("start_date") as string,
                end_date: formData.get("end_date") as string,
                description: descHtml,
                poster_url,
                is_active: formData.get("is_active") === "on",
                is_main_slider: formData.get("is_main_slider") === "on",
                youtube_url: (formData.get("youtube_url") as string) || null, // 수정: 유튜브 URL 추가
            })
            .eq("id", id);

        if (error) {
            alert("수정 실패");
            setIsLoading(false);
            return;
        }

        alert("수정 완료!");
        router.push("/admin/exhibition");
    };

    if (loading) {
        return <div className="max-w-3xl mx-auto py-20 px-6">로딩 중...</div>;
    }

    if (!exhibition) {
        return <div className="max-w-3xl mx-auto py-20 px-6">전시를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto py-20 px-6 animate-fade-in-up">
            <h1 className="text-3xl font-serif font-bold mb-10 border-b pb-4">
                전시 수정
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">전시 제목 *</label>
                        <input
                            name="title"
                            type="text"
                            defaultValue={exhibition.title}
                            className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">작가명 *</label>
                        <input
                            name="artist"
                            type="text"
                            defaultValue={exhibition.artist}
                            className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">시작일 *</label>
                            <input
                                name="start_date"
                                type="date"
                                defaultValue={exhibition.start_date}
                                className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">종료일 *</label>
                            <input
                                name="end_date"
                                type="date"
                                defaultValue={exhibition.end_date}
                                className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* 포스터 이미지 */}
                <div>
                    <label className="block text-sm font-bold mb-2">포스터 이미지</label>
                    {exhibition.poster_url && (
                        <div className="mb-4">
                            <div className="flex items-start gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">현재 이미지:</p>
                                    <img src={exhibition.poster_url} alt="현재 포스터" className="w-32 h-auto rounded" />
                                </div>
                                <Button
                                    type="button"
                                    onClick={handleDeleteImage}
                                    variant="outline"
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                    이미지 삭제
                                </Button>
                            </div>
                        </div>
                    )}
                    <input
                        name="poster"
                        type="file"
                        accept="image/*"
                        className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">새 이미지를 선택하면 기존 이미지가 자동으로 삭제됩니다.</p>
                </div>

                {/* 상세 설명 */}
                <div>
                    <label className="block text-sm font-bold mb-2">상세 설명</label>
                    <div className="min-h-[200px] border rounded-md p-1">
                        <Editor onChange={(html: string) => setDescHtml(html)} initialContent={exhibition.description} />
                    </div>
                </div>

                {/* 옵션 */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_active"
                            id="is_active"
                            defaultChecked={exhibition.is_active}
                            className="w-4 h-4"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium">
                            활성화 (체크하면 공개 페이지에 표시됩니다)
                        </label>
                    </div>
                    {/* 메인 슬라이더 옵션 + 유튜브 URL */}
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row gap-4 md:items-center border border-gray-200">
                        <div className="flex items-center gap-2 shrink-0">
                            <input
                                type="checkbox"
                                name="is_main_slider"
                                id="is_main_slider"
                                defaultChecked={exhibition.is_main_slider}
                                className="w-4 h-4 accent-black cursor-pointer"
                            />
                            <label htmlFor="is_main_slider" className="text-sm font-medium cursor-pointer">
                                메인 슬라이더에 표시
                            </label>
                        </div>
                        
                        <div className="flex-1">
                             <input
                               name="youtube_url"
                               type="text"
                               defaultValue={exhibition.youtube_url || ""}
                               placeholder="유튜브 영상 URL (메인 슬라이더 배경으로 사용시 입력)"
                               className="w-full bg-transparent border-b border-gray-300 p-2 text-sm focus:outline-none focus:border-black"
                             />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white py-6 text-lg font-bold hover:bg-gray-800 transition"
                >
                    {isLoading ? "수정 중..." : "수정 완료"}
                </Button>
            </form>
        </div>
    );
}
