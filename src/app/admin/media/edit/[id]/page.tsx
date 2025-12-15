"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dynamicImport from "next/dynamic";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const Editor = dynamicImport(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => <div className="min-h-[200px] border rounded-md p-4 flex items-center justify-center text-gray-400">에디터 로딩 중...</div>
});

export const dynamic = "force-dynamic";

export default function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [media, setMedia] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [contentHtml, setContentHtml] = useState("");
    
    useEffect(() => {
        async function loadMedia() {
            try {
                const docRef = doc(db, "media_releases", id);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    alert("보도자료 정보를 불러올 수 없습니다.");
                    router.push("/admin/media");
                    return;
                }

                const data = docSnap.data();
                setMedia(data);
                setContentHtml(data.content || "");
                setLoading(false);

            } catch (error) {
                console.error("Load Error:", error);
                alert("불러오기 실패");
                router.push("/admin/media");
            }
        }
        loadMedia();
    }, [id, router]);

    const handleDeleteImage = async () => {
        if (!confirm("이미지를 삭제하시겠습니까?")) return;

        try {
            // Optional: Delete from Storage (if generated file)
            // if (media.image_url && media.image_url.includes("firebasestorage")) { ... }
            // For now, just remove link from DB.

            const docRef = doc(db, "media_releases", id);
            await updateDoc(docRef, { image_url: null });

            setMedia({ ...media, image_url: null });
            alert("이미지가 삭제되었습니다.");
        } catch (error) {
            console.error("Delete Image Error:", error);
            alert("이미지 삭제 실패");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const imageFile = formData.get("image") as File;
        let image_url = media.image_url;

        try {
            // New Image Upload
            if (imageFile && imageFile.size > 0) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `media/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const storageRef = ref(storage, `og_images/${fileName}`);

                await uploadBytes(storageRef, imageFile);
                image_url = await getDownloadURL(storageRef);
            }

            // Update Doc
            const docRef = doc(db, "media_releases", id);
            await updateDoc(docRef, {
                press_name: formData.get("press_name") as string,
                title: formData.get("title") as string,
                link_url: formData.get("link_url") as string,
                content: contentHtml, // Use state from Editor
                published_date: formData.get("published_date") as string || null,
                image_url,
                updated_at: new Date().toISOString()
            });

            toast.success("수정 완료!");
            router.push("/admin/media");
            router.refresh();

        } catch (error: any) {
            console.error("Update Error:", error);
            toast.error("수정 실패: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) return <div className="max-w-3xl mx-auto py-20 px-6">로딩 중...</div>;
    if (!media) return <div className="max-w-3xl mx-auto py-20 px-6">보도자료를 찾을 수 없습니다.</div>;

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
