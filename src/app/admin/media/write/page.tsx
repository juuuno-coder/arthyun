"use client";

import { useState } from "react";
import { createMedia } from "@/actions/mediaActions";
import dynamicImport from "next/dynamic";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@supabase/ssr"; // Use Browser Client for Auth Cookies
import { toast } from "sonner"; 

// Editor를 동적으로 import (SSR 방지)
const Editor = dynamicImport(() => import("@/components/Editor"), {
    ssr: false,
    loading: () => <div className="min-h-[200px] border rounded-md p-4 flex items-center justify-center text-gray-400">에디터 로딩 중...</div>
});

// 정적 생성 방지 (클라이언트 전용 컴포넌트)
export const dynamic = "force-dynamic";

export default function AdminMediaWrite() {
    const [contentHtml, setContentHtml] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // Authenticated Client for File Uploads
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const form = e.currentTarget;
        const formData = new FormData(form);
        const imageFile = formData.get("image") as File;

        try {
            // 1. Client-Side Image Upload (if file selected)
            if (imageFile && imageFile.size > 0) {
                const fileExt = imageFile.name.split(".").pop();
                const fileName = `media/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("og_images")
                    .upload(fileName, imageFile);

                if (uploadError) throw new Error("이미지 업로드 실패: " + uploadError.message);

                const { data: { publicUrl } } = supabase.storage
                    .from("og_images")
                    .getPublicUrl(fileName);

                // Add URL to formData and remove file to prevent double upload or serialization issues
                formData.set("image_url_direct", publicUrl);
                formData.delete("image"); // Remove file from formData sent to server
            }

            // 2. Submit to Server Action
            await createMedia(formData); 
            // createMedia handles redirect on success, so no toast needed here usually, 
            // but if it fails it throws.
            
        } catch (error: any) {
            console.error(error);
            
            let message = error.message;
            if (message.includes("The object exceeded the maximum allowed size")) {
                message = "이미지 용량이 너무 큽니다. (더 작은 이미지를 사용해주세요)";
            } else if (message.includes("row-level security policy")) {
                message = "이미지 업로드 권한이 없습니다. (새로고침 후 다시 시도해주세요)";
            } else if (message.includes("Payload too large")) {
                message = "요청 용량이 너무 큽니다.";
            }

            toast.error(message);
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-20 px-6 animate-fade-in-up">
            <h1 className="text-3xl font-serif font-bold mb-10 border-b pb-4">
                보도자료 등록
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. 기본 정보 */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">언론사명 *</label>
                        <input
                            name="press_name"
                            type="text"
                            placeholder="예: 부산일보"
                            className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">기사 제목 *</label>
                        <input
                            name="title"
                            type="text"
                            className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">원문 링크 *</label>
                        <input
                            name="link_url"
                            type="url"
                            placeholder="https://..."
                            className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">기사 작성일</label>
                        <input
                            name="published_date"
                            type="date"
                            className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
                        />
                        <p className="text-xs text-gray-500 mt-1">기사가 작성된 날짜를 선택하세요. 입력하지 않으면 등록일이 표시됩니다.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">대표 이미지</label>
                        <input
                            name="image"
                            type="file"
                            accept="image/*"
                            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-black transition"
                        />
                        <p className="text-xs text-gray-500 mt-1">선택사항: 보도자료 대표 이미지</p>
                    </div>
                </div>

                {/* 2. 요약 내용 (Editor) - 선택사항이지만 에디터 사용 */}
                <div>
                    <label className="block text-sm font-bold mb-2">
                        요약/발췌 내용
                    </label>
                    <div className="min-h-[200px] border rounded-md p-1">
                        <Editor onChange={(html: string) => setContentHtml(html)} />
                    </div>
                    <input type="hidden" name="content" value={contentHtml} />
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white py-6 text-lg font-bold hover:bg-gray-800 transition"
                >
                    {isLoading ? "업로드 중..." : "등록하기"}
                </Button>
            </form>
        </div>
    );
}
