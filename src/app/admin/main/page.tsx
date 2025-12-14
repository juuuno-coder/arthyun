"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { compressImage } from "@/utils/compressImage";

export default function AdminMainPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [id, setId] = useState<string | null>(null);
    
    // Fields
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [centerText, setCenterText] = useState("");
    const [posterUrl, setPosterUrl] = useState<string | null>(null);
    const [linkUrl, setLinkUrl] = useState("");
    const [newPosterFile, setNewPosterFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("main_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(error);
            toast.error("설정을 불러오는데 실패했습니다.");
        } else if (data) {
            setId(data.id);
            setYoutubeUrl(data.youtube_url || "");
            setCenterText(data.center_text || "");
            setPosterUrl(data.poster_url || null);
            setLinkUrl(data.link_url || "");
        } else {
            setYoutubeUrl("https://www.youtube.com/watch?v=AMlZ14j5DtQ");
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let finalPosterUrl = posterUrl;

        // 이미지 업로드
        if (newPosterFile) {
            // 압축 적용
            const compressedFile = await compressImage(newPosterFile);
            const fileName = `main-poster-${Date.now()}.webp`;
            
            const { error: uploadError } = await supabase.storage
                .from("og_images")
                .upload(`main/${fileName}`, compressedFile);

            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
                .from("og_images")
                .getPublicUrl(`main/${fileName}`);
            
            finalPosterUrl = publicUrl;
        }

            let error;
            
            if (id) {
                const { error: updateError } = await supabase
                    .from("main_settings")
                    .update({
                        youtube_url: youtubeUrl,
                        center_text: centerText,
                        poster_url: finalPosterUrl,
                        link_url: linkUrl,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("main_settings")
                    .insert({
                        youtube_url: youtubeUrl,
                        center_text: centerText,
                        poster_url: finalPosterUrl,
                        link_url: linkUrl,
                    });
                error = insertError;
            }

            if (error) throw error;

            toast.success("메인 페이지 설정이 저장되었습니다.");
            fetchSettings();
            setNewPosterFile(null); // Reset new file
        } catch (err: any) {
            console.error(err);
            toast.error("저장 실패: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setNewPosterFile(e.dataTransfer.files[0]);
        }
    };
    
    // 포스터 삭제 핸들러
    const deletePoster = async () => {
        if(!confirm("등록된 포스터 이미지를 삭제하시겠습니까?")) return;
        setPosterUrl(null);
        setNewPosterFile(null);
        // 즉시 반영을 원하면 여기서 update를 날려도 되지만, 저장 버튼을 누를 때 반영되도록 함.
        // 다만 UX상 저장 버튼 눌러야 함을 인지시켜야 함.
    };

    if (loading) {
        return <div className="p-20 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-20 px-6">
            <h1 className="text-3xl font-serif font-bold mb-2">메인 페이지 관리</h1>
            <p className="text-gray-500 mb-10">
                메인 화면의 배경 영상, 중앙 포스터 이미지 및 텍스트를 설정합니다.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border rounded-lg shadow-sm">
                
                {/* 유튜브 링크 */}
                <div className="space-y-2">
                    <Label htmlFor="youtube">배경 유튜브 링크</Label>
                    <Input 
                        id="youtube"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                    />
                    <p className="text-xs text-gray-400">
                        * 유튜브 영상의 전체 URL 주소를 입력해주세요.
                    </p>
                </div>

                {/* 포스터 이미지 (Drag & Drop) */}
                <div className="space-y-2">
                     <Label>메인 중앙 포스터 이미지</Label>
                     <div
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${
                            isDragging ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        onClick={() => document.getElementById('poster-upload')?.click()}
                    >
                        <input
                            id="poster-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => setNewPosterFile(e.target.files?.[0] || null)}
                        />
                        
                        {newPosterFile ? (
                            <div className="text-center w-full">
                                <div className="relative w-full h-64 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                                     {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={URL.createObjectURL(newPosterFile)} 
                                        alt="Preview" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                                <p className="text-sm text-green-600 font-medium">
                                    {newPosterFile.name} (새로운 이미지)
                                </p>
                                <p className="text-xs text-gray-400 mt-1">변경하려면 클릭하거나 다시 드래그하세요</p>
                            </div>
                        ) : posterUrl ? (
                            <div className="text-center w-full relative">
                                <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="sm" 
                                    className="absolute top-0 right-0 z-10"
                                    onClick={(e) => { e.stopPropagation(); deletePoster(); }}
                                >
                                    삭제
                                </Button>
                                <div className="relative w-full h-64 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={posterUrl} 
                                        alt="Current" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                                <p className="text-sm text-gray-600 font-medium">
                                    현재 등록된 포스터
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
                                <p className="text-gray-600 font-medium mb-1">포스터 이미지를 드래그하거나 클릭하여 업로드</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 포스터 링크 URL */}
                <div className="space-y-2">
                    <Label htmlFor="linkUrl">포스터 클릭 시 이동할 주소 (선택 사항)</Label>
                    <Input 
                        id="linkUrl"
                        placeholder="예: /archive 또는 https://google.com"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                    />
                </div>

                {/* 중앙 텍스트 */}
                <div className="space-y-2">
                    <Label htmlFor="centerText">메인 중앙 텍스트 (하단 표시)</Label>
                    <Textarea 
                        id="centerText"
                        placeholder="포스터 아래에 표시될 텍스트입니다."
                        className="min-h-[150px] font-serif text-lg leading-relaxed resize-none"
                        value={centerText}
                        onChange={(e) => setCenterText(e.target.value)}
                    />
                    <p className="text-xs text-gray-400">
                        * 비워두면 기존 'EXHIBITION PREPARING' 문구가 표시됩니다.
                    </p>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" className="bg-black text-white hover:bg-gray-800 w-32" disabled={saving}>
                        {saving ? "저장 중..." : "설정 저장"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
