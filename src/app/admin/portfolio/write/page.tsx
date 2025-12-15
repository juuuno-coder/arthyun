"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import dynamicImport from "next/dynamic";
import { compressImage } from "@/utils/compressImage";
import { db, storage } from "@/lib/firebase"; // Firestore & Storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore"; // Firestore Write

// Rich Editor (Client side only)
const Editor = dynamicImport(() => import("@/components/Editor"), { ssr: false });

export default function WritePortfolioPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isFeatured, setIsFeatured] = useState(false); // New State

    // Form States
    const [title, setTitle] = useState("");
    const [client, setClient] = useState("");
    const [completionDate, setCompletionDate] = useState(""); 
    const [category, setCategory] = useState("Public Art");
    const [content, setContent] = useState("");
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting form..."); // DEBUG

        if (!title) {
            toast.error("프로젝트명을 입력해주세요.");
            return;
        }

        setIsLoading(true);

        try {
            let thumbnailUrl = null;

            // 1. Upload Thumbnail (Client-side)
            if (thumbnailFile) {
                console.log("Starting image upload..."); // DEBUG
                // 압축 적용
                console.log("Compressing image..."); // DEBUG
                const compressedFile = await compressImage(thumbnailFile);
                console.log("Compressed file:", compressedFile); // DEBUG
                
                const fileName = `portfolio/${Date.now()}.webp`;
                const storageRef = ref(storage, `og_images/${fileName}`);
                
                console.log("Uploading bytes to:", storageRef.fullPath); // DEBUG
                const snapshot = await uploadBytes(storageRef, compressedFile);
                console.log("Upload snapshot:", snapshot); // DEBUG

                console.log("Getting download URL..."); // DEBUG
                thumbnailUrl = await getDownloadURL(storageRef);
                console.log("Thumbnail URL:", thumbnailUrl); // DEBUG
            }

            // 2. Create Document in Firestore (Client-side)
            console.log("Creating Firestore document..."); // DEBUG
            const docData = {
                title,
                client,
                location: null,
                completion_date: completionDate || null,
                category,
                description: content,
                thumbnail_url: thumbnailUrl,
                is_visible: true,
                is_featured: isFeatured,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            console.log("Document Data:", docData); // DEBUG

            const docRef = await addDoc(collection(db, "portfolios"), docData);
            console.log("Document Created with ID:", docRef.id); // DEBUG
            
            toast.success("포트폴리오가 등록되었습니다.");
            alert("성공적으로 등록되었습니다!"); // 명시적 알림
            router.push("/admin/portfolio");
            router.refresh(); // Refresh Client Cache
            
        } catch (error: any) {
            console.error("Submission Error:", error); // DEBUG
            alert(`등록 실패 상세 에러: ${error.message} \n (콘솔 로그를 확인해주세요)`);
            toast.error("등록 실패: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setThumbnailFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-20 px-6">
            <h1 className="text-3xl font-serif font-bold mb-10">새 포트폴리오 등록</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 0. Main Slide Toggle */}
                <div className="flex items-center space-x-2 border p-4 rounded-md bg-blue-50 border-blue-100 mb-6">
                    <input
                        type="checkbox"
                        id="featured-check"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-5 h-5 accent-blue-600 cursor-pointer"
                    />
                    <Label htmlFor="featured-check" className="cursor-pointer font-bold flex flex-col text-blue-900">
                        <span>메인 슬라이드 등록 (Featured)</span>
                        <span className="text-xs text-blue-700 font-normal">체크 시 메인 페이지 상단 슬라이드에 노출됩니다.</span>
                    </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* 1. 카테고리 (Category) */}
                     <div className="space-y-2 md:col-span-2">
                        <Label>카테고리</Label>
                        <select 
                            className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="Culture">문화예술</option>
                            <option value="Painting">페인팅</option>
                            <option value="PublicArtDesign">공공미술/디자인</option>
                            <option value="Exhibition">전시/박람회</option>
                            <option value="Space">공간조성</option>
                            <option value="Sculpture">조형물</option>
                            <option value="Festival">축제/이벤트</option>
                            <option value="Education">체험/교육</option>
                            <option value="Other">기타</option>
                        </select>
                    </div>

                    {/* 2. 프로젝트명 */}
                    <div className="space-y-2">
                        <Label>프로젝트명 *</Label>
                        <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="예: 부산시청 벽화 프로젝트" 
                            required 
                            className="h-12"
                        />
                    </div>

                    {/* 3. 발주처 / 클라이언트 */}
                    <div className="space-y-2">
                        <Label>발주처 / 클라이언트</Label>
                        <Input 
                            value={client} 
                            onChange={(e) => setClient(e.target.value)} 
                            placeholder="예: 부산광역시" 
                            className="h-12"
                        />
                    </div>

                    {/* 4. 완공일 */}
                    <div className="space-y-2">
                        <Label>프로젝트 완료일</Label>
                        <Input 
                            type="date"
                            value={completionDate} 
                            onChange={(e) => setCompletionDate(e.target.value)} 
                            className="h-12"
                        />
                    </div>

                    {/* 5. 대표 이미지 (Thumbnail) - Drag & Drop */}
                    <div className="space-y-2 md:col-span-2">
                        <Label>대표 이미지 (썸네일)</Label>
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${
                                isDragging ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            onClick={() => document.getElementById('thumbnail-upload')?.click()}
                        >
                            <input
                                id="thumbnail-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                            />
                            
                            {thumbnailFile ? (
                                <div className="text-center w-full">
                                    <div className="relative w-full h-64 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={URL.createObjectURL(thumbnailFile)} 
                                            alt="Preview" 
                                            className="w-full h-full object-contain" 
                                        />
                                    </div>
                                    <p className="text-sm text-green-600 font-medium">
                                        {thumbnailFile.name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">클릭하거나 드래그하여 변경</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        {/* Icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 font-medium mb-1">이미지를 드래그하거나 클릭하여 업로드</p>
                                    <p className="text-xs text-gray-400">JPG, PNG, GIF (최대 10MB)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>상세 내용 (이미지 및 설명)</Label>
                    <div className="min-h-[400px] border rounded-md">
                        <Editor initialContent={content} onChange={setContent} />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-10">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        취소
                    </Button>
                    <Button type="submit" className="bg-black text-white" disabled={isLoading}>
                        {isLoading ? "등록 중..." : "등록하기"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
