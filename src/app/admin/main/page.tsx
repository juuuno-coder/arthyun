"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, query, limit, getDocs, doc, setDoc, updateDoc, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { compressImage } from "@/utils/compressImage";
import Link from "next/link";
import Image from "next/image";

// 타입 정의
type MainSettings = {
    id?: string;
    youtube_url: string;
    center_text: string;
    poster_url: string | null;
    link_url: string;
};

type Portfolio = {
    id: string;
    title: string;
    thumbnail_url: string;
    client?: string;
};

export default function AdminMainPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Main Settings State
    const [settingsId, setSettingsId] = useState<string>("1"); // Default ID
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [centerText, setCenterText] = useState("");
    const [posterUrl, setPosterUrl] = useState<string | null>(null);
    const [linkUrl, setLinkUrl] = useState("");
    const [newPosterFile, setNewPosterFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Featured Portfolios State
    const [featuredList, setFeaturedList] = useState<Portfolio[]>([]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchSettings(), fetchFeatured()]);
        setLoading(false);
    };

    const fetchSettings = async () => {
        try {
            // First try to get specific doc "1"
            const q = query(collection(db, "main_settings"), limit(1));
            const snap = await getDocs(q);
            
            if (!snap.empty) {
                const data = snap.docs[0].data();
                setSettingsId(snap.docs[0].id);
                setYoutubeUrl(data.youtube_url || "");
                setCenterText(data.center_text || "");
                setPosterUrl(data.poster_url || null);
                setLinkUrl(data.link_url || "");
            } else {
                setYoutubeUrl("https://www.youtube.com/watch?v=AMlZ14j5DtQ");
            }
        } catch (error) {
            console.error(error);
            toast.error("설정을 불러오는데 실패했습니다.");
        }
    };

    const fetchFeatured = async () => {
        try {
            const q = query(collection(db, "portfolios"), where("is_featured", "==", true));
            const snap = await getDocs(q);
            const list: Portfolio[] = [];
            snap.forEach(doc => {
                const d = doc.data();
                list.push({ id: doc.id, title: d.title, thumbnail_url: d.thumbnail_url, client: d.client });
            });
            setFeaturedList(list);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            let finalPosterUrl = posterUrl;

            // 이미지 업로드
            if (newPosterFile) {
                const compressedFile = await compressImage(newPosterFile);
                const fileName = `main-poster-${Date.now()}.webp`;
                const storageRef = ref(storage, `main/${fileName}`);
                
                await uploadBytes(storageRef, compressedFile);
                finalPosterUrl = await getDownloadURL(storageRef);
            }

            // Save to Firestore (Use setDoc with merge to ensure doc exists)
            await setDoc(doc(db, "main_settings", settingsId), {
                youtube_url: youtubeUrl,
                center_text: centerText,
                poster_url: finalPosterUrl,
                link_url: linkUrl,
                updated_at: new Date().toISOString(),
            }, { merge: true });

            toast.success("메인 페이지 설정이 저장되었습니다.");
            setNewPosterFile(null);
            fetchSettings(); // Refresh
        } catch (err: any) {
            console.error(err);
            toast.error("저장 실패: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveFeatured = async (id: string, title: string) => {
        if(!confirm(`'${title}' 항목을 메인 슬라이드에서 제외하시겠습니까?`)) return;
        
        try {
            await updateDoc(doc(db, "portfolios", id), {
                is_featured: false,
                updated_at: new Date().toISOString()
            });
            toast.success("메인 슬라이드에서 제외되었습니다.");
            fetchFeatured(); // Refresh list
        } catch (error: any) {
            toast.error("제외 실패: " + error.message);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setNewPosterFile(e.dataTransfer.files[0]);
        }
    };
    
    const deletePoster = async () => {
        if(!confirm("등록된 포스터 이미지를 리스트에서 제거하시겠습니까? (저장 시 반영)")) return;
        setPosterUrl(null);
        setNewPosterFile(null);
    };

    if (loading) {
        return <div className="p-20 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-20 px-6 space-y-16">
            
            {/* 1. Featured Slides Management */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <h1 className="text-3xl font-serif font-bold">메인 슬라이드 관리</h1>
                    <Link href="/admin/portfolio">
                        <Button variant="outline">
                            + 포트폴리오에서 추가하기
                        </Button>
                    </Link>
                </div>
                
                <p className="text-gray-500 text-sm">
                    현재 메인 화면 상단 슬라이드에 노출되고 있는 포트폴리오 목록입니다.
                </p>

                {featuredList.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {featuredList.map((item) => (
                            <div key={item.id} className="relative group border rounded-lg overflow-hidden bg-white shadow-sm">
                                <div className="aspect-square relative">
                                    <Image 
                                        src={item.thumbnail_url} 
                                        alt={item.title} 
                                        fill 
                                        className="object-cover"
                                    />
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-sm truncate">{item.title}</h3>
                                    <p className="text-xs text-gray-400 truncate">{item.client || "Client"}</p>
                                </div>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-8 text-xs"
                                        onClick={() => handleRemoveFeatured(item.id, item.title)}
                                    >
                                        제외
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 bg-gray-50 rounded text-center text-gray-400">
                        현재 등록된 슬라이드가 없습니다. 포트폴리오 관리에서 '메인 노출'을 체크하세요.
                    </div>
                )}
            </div>

            <hr className="border-gray-200" />

            {/* 2. Background & Fallback Settings */}
            <div className="space-y-6">
                <h2 className="text-2xl font-serif font-bold border-b pb-4">배경 및 기본 설정</h2>
                <p className="text-gray-500 mb-6">
                    슬라이드 배경 영상 및 슬라이드가 없을 때 보여질 기본 화면을 설정합니다.
                </p>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 border rounded-lg shadow-sm">
                    
                    {/* 유튜브 링크 */}
                    <div className="space-y-2">
                        <Label htmlFor="youtube">배경 유튜브 링크 (필수)</Label>
                        <Input 
                            id="youtube"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                        />
                        <p className="text-xs text-gray-400">
                            * 메인 화면 전체 배경으로 재생될 유튜브 영상 URL입니다.
                        </p>
                    </div>

                    {/* 포스터 이미지 (Fallback) */}
                    <div className="space-y-2">
                         <Label>대기 화면 포스터 (슬라이드 없을 때 표시)</Label>
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
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 mb-2">이미지 업로드</div>
                                    <p className="text-xs text-gray-400">슬라이드가 없을 때 중앙에 표시될 이미지입니다.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 포스터 링크 URL */}
                    <div className="space-y-2">
                        <Label htmlFor="linkUrl">포스터 클릭 링크</Label>
                        <Input 
                            id="linkUrl"
                            placeholder="예: /portfolio"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                        />
                    </div>

                    {/* 중앙 텍스트 */}
                    <div className="space-y-2">
                        <Label htmlFor="centerText">중앙 텍스트 (하단 표시)</Label>
                        <Textarea 
                            id="centerText"
                            placeholder="포스터 아래에 표시될 텍스트입니다."
                            className="min-h-[100px] font-serif resize-none"
                            value={centerText}
                            onChange={(e) => setCenterText(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" className="bg-black text-white px-8" disabled={saving}>
                            {saving ? "저장 중..." : "설정 저장"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
