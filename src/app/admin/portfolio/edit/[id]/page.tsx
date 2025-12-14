"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { compressImage } from "@/utils/compressImage";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function EditPortfolioPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isDragging, setIsDragging] = useState(false);

    // Form States
    const [title, setTitle] = useState("");
    const [client, setClient] = useState("");
    // location and completionDate are hidden but state remains to preserve data on update
    const [location, setLocation] = useState("");
    const [completionDate, setCompletionDate] = useState("");
    const [category, setCategory] = useState("Public Art");
    const [content, setContent] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
    const [isVisible, setIsVisible] = useState(true); // Default true

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            const { data, error } = await supabase
                .from("portfolios")
                .select("*")
                .eq("id", id)
                .single();
            
            if (error) {
                toast.error("데이터를 불러오지 못했습니다.");
                router.push("/admin/portfolio");
                return;
            }

            if (data) {
                setTitle(data.title);
                setClient(data.client || "");
                setLocation(data.location || "");
                setCompletionDate(data.completion_date || "");
                setCategory(data.category || "Public Art");
                setContent(data.description || "");
                setThumbnailUrl(data.thumbnail_url);
                setIsVisible(data.is_visible ?? true);
            }
            setIsFetching(false);
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let finalThumbnailUrl = thumbnailUrl;

            // 새 이미지가 있으면 업로드
            if (newThumbnailFile) {
                // 압축 적용
                const compressedFile = await compressImage(newThumbnailFile);
                
                const fileName = `${Date.now()}.webp`;
                const { error: uploadError } = await supabase.storage
                    .from("og_images")
                    .upload(`portfolio/${fileName}`, compressedFile);

                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabase.storage
                    .from("og_images") // Using og_images bucket for convenience
                    .getPublicUrl(`portfolio/${fileName}`);
                
                finalThumbnailUrl = publicUrl;
            }

            // Update
            const { error: updateError } = await supabase
                .from("portfolios")
                .update({
                    title,
                    client,
                    location, // Persist existing value
                    completion_date: completionDate === "" ? null : completionDate, // 빈 문자열이면 null로 저장
                    category,
                    description: content,
                    thumbnail_url: finalThumbnailUrl,
                    is_visible: isVisible
                })
                .eq("id", id);

            if (updateError) throw updateError;

            toast.success("수정되었습니다.");
            router.push("/admin/portfolio");
            router.refresh(); // 목록 갱신을 위해 리프레시
        } catch (error: any) {
            toast.error("수정 실패: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setNewThumbnailFile(e.dataTransfer.files[0]);
        }
    };

    if (isFetching) return <div className="p-20 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto py-20 px-6">
            <h1 className="text-3xl font-serif font-bold mb-10">포트폴리오 수정</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* 1. 카테고리 (Category) - Moved to Top */}
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

                    {/* 1-B. 공개 여부 (Visibility) */}
                    <div className="md:col-span-2 flex items-center space-x-2 border p-4 rounded-md bg-gray-50">
                        <input
                            type="checkbox"
                            id="visibility-check"
                            checked={isVisible}
                            onChange={(e) => setIsVisible(e.target.checked)}
                            className="w-5 h-5 accent-black cursor-pointer"
                        />
                        <Label htmlFor="visibility-check" className="cursor-pointer font-bold flex flex-col">
                            <span>메인 페이지 노출 (Public)</span>
                            <span className="text-xs text-gray-400 font-normal">체크 해제 시 관리자 페이지에서만 보입니다. (Draft)</span>
                        </Label>
                    </div>

                    {/* 2. 프로젝트명 (Project Name) */}
                    <div className="space-y-2">
                        <Label>프로젝트명 *</Label>
                        <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            required 
                            className="h-12"
                        />
                    </div>

                    {/* 3. 발주처 / 클라이언트 (Client) */}
                    <div className="space-y-2">
                        <Label>발주처 / 클라이언트</Label>
                        <Input 
                            value={client} 
                            onChange={(e) => setClient(e.target.value)} 
                            className="h-12"
                        />
                    </div>

                    {/* 4. 프로젝트 완료일 (Completion Date) */}
                    <div className="space-y-2">
                        <Label>프로젝트 완료일</Label>
                        <Input 
                            type="date"
                            value={completionDate} 
                            onChange={(e) => setCompletionDate(e.target.value)} 
                            className="h-12"
                        />
                    </div>

                    {/* 4. 대표 이미지 (Thumbnail) - Drag & Drop */}
                    <div className="space-y-2 md:col-span-2">
                         <Label>대표 이미지 (변경 시 선택)</Label>
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
                                onChange={(e) => setNewThumbnailFile(e.target.files?.[0] || null)}
                            />
                            
                            {newThumbnailFile ? (
                                <div className="text-center w-full">
                                    <div className="relative w-full h-64 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={URL.createObjectURL(newThumbnailFile)} 
                                            alt="Preview" 
                                            className="w-full h-full object-contain" 
                                        />
                                    </div>
                                    <p className="text-sm text-green-600 font-medium">
                                        {newThumbnailFile.name} (새로운 이미지)
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">클릭하거나 드래그하여 변경</p>
                                </div>
                            ) : thumbnailUrl ? (
                                <div className="text-center w-full">
                                    <div className="relative w-full h-64 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={thumbnailUrl} 
                                            alt="Current" 
                                            className="w-full h-full object-contain" 
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">
                                        현재 등록된 이미지
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">변경하려면 클릭하거나 드래그하세요</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
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
                    <Label>상세 내용</Label>
                    <div className="min-h-[400px] border rounded-md">
                        <Editor initialContent={content} onChange={setContent} />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-10">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        취소
                    </Button>
                    <Button type="submit" className="bg-black text-white" disabled={isLoading}>
                        {isLoading ? "저장 중..." : "수정 저장"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
