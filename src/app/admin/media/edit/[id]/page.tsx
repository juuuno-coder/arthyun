"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import dynamicImport from "next/dynamic";

// Editor를 동적으로 import (SSR 방지)
const Editor = dynamicImport(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => <div className="min-h-[200px] border rounded-md p-4 flex items-center justify-center text-gray-400">에디터 로딩 중...</div>
});

// 정적 생성 방지
export const dynamic = "force-dynamic";

export default function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [media, setMedia] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [contentHtml, setContentHtml] = useState("");
    
    // Authenticated Client
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        async function loadMedia() {
            const { data, error } = await supabase
                .from("media_releases")
                .select("*")
                .eq("id", id)
                .single();

            if (error) {
                alert("보도자료 정보를 불러올 수 없습니다.");
                router.push("/admin/media");
                return;
            }

            setMedia(data);
            setContentHtml(data.content || ""); // 초기 내용 설정
            setLoading(false);
        }

        loadMedia();
    }, [id, router]);

    // 이미지 삭제 함수
    const handleDeleteImage = async () => {
        if (!confirm("이미지를 삭제하시겠습니까?")) return;

        const { error } = await supabase
            .from("media_releases")
            .update({ image_url: null })
            .eq("id", id);

        if (error) {
            alert("이미지 삭제 실패");
            return;
        }

        setMedia({ ...media, image_url: null });
        alert("이미지가 삭제되었습니다.");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const imageFile = formData.get("image") as File;

        let image_url = media.image_url;

        // 새 이미지가 업로드된 경우
        if (imageFile && imageFile.size > 0) {
            // 기존 이미지가 있으면 Storage에서 삭제
            if (media.image_url) {
                try {
                    // URL에서 파일명 추출 (전체 경로에서 마지막 부분만)
                    const urlParts = media.image_url.split('/');
                    const oldFileName = urlParts[urlParts.length - 1];

                    // 쿼리 파라미터 제거 (예: ?token=xxx)
                    const cleanFileName = oldFileName.split('?')[0];

                    if (cleanFileName && cleanFileName !== 'null' && cleanFileName !== 'undefined') {
                        await supabase.storage
                            .from("og_images")
                            .remove([cleanFileName]);
                    }
                } catch (error) {
                    console.error("기존 이미지 삭제 실패:", error);
                    // 삭제 실패해도 계속 진행
                }
            }

            // 새 이미지 업로드
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `media/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("og_images")
                .upload(fileName, imageFile);

            if (uploadError) {
                console.error("업로드 에러:", uploadError);
                
                let message = uploadError.message;
                if (message.includes("Bucket not found")) {
                    message = "설정된 이미지 저장소(Bucket)가 없습니다. 관리자에게 문의하세요.";
                } else if (message.includes("The object exceeded the maximum allowed size")) {
                    message = "이미지 용량이 너무 큽니다.";
                } else if (message.includes("row-level security")) {
                    message = "이미지 업로드 권한이 없습니다.";
                }
                
                toast.error(message);
                setIsLoading(false);
                return;
            }

            const { data: urlData } = supabase.storage
                .from("og_images")
                .getPublicUrl(fileName);
            image_url = urlData.publicUrl;
        }

        const { error } = await supabase
            .from("media_releases")
            .update({
                press_name: formData.get("press_name") as string,
                title: formData.get("title") as string,
                link_url: formData.get("link_url") as string,
                content: formData.get("content") as string,
                published_date: formData.get("published_date") as string || null,
                image_url,
            })
            .eq("id", id);

        if (error) {
            toast.error("수정 실패: " + error.message);
            setIsLoading(false);
            return;
        }

        toast.success("수정 완료!");
        router.push("/admin/media");
    };

    if (loading) {
        return <div className="max-w-3xl mx-auto py-20 px-6">로딩 중...</div>;
    }

    if (!media) {
        return <div className="max-w-3xl mx-auto py-20 px-6">보도자료를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="max-w-3xl mx-auto py-20 px-6 animate-fade-in-up">
            <h1 className="text-3xl font-serif font-bold mb-10 border-b pb-4">
                보도자료 수정
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold mb-2">언론사명 *</label>
                    <input
                        name="press_name"
                        type="text"
                        defaultValue={media.press_name}
                        className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">기사 제목 *</label>
                    <input
                        name="title"
                        type="text"
                        defaultValue={media.title}
                        className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">원문 링크 *</label>
                    <input
                        name="link_url"
                        type="url"
                        defaultValue={media.link_url}
                        className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                        placeholder="https://..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">기사 작성일</label>
                    <input
                        name="published_date"
                        type="date"
                        defaultValue={media.published_date || ""}
                        className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">기사가 작성된 날짜를 선택하세요. 입력하지 않으면 등록일이 표시됩니다.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">내용</label>
                    <div className="min-h-[400px] border rounded-md p-1">
                        <Editor
                            initialContent={media.content}
                            onChange={(html: string) => setContentHtml(html)}
                        />
                    </div>
                    {/* 텍스트 에디터 내용을 폼 전송에 포함시키기 위한 hidden input */}
                    <input type="hidden" name="content" value={contentHtml} />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">대표 이미지</label>
                    {media.image_url && (
                        <div className="mb-4">
                            <div className="flex items-start gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">현재 이미지:</p>
                                    <img src={media.image_url} alt="현재 이미지" className="w-48 h-auto rounded" />
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
                        name="image"
                        type="file"
                        accept="image/*"
                        className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">새 이미지를 선택하면 기존 이미지가 자동으로 삭제됩니다.</p>
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
