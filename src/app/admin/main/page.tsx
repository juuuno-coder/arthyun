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
    link_url?: string;
};

export default function AdminMainPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Main Settings State (Global)
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
                list.push({ 
                    id: doc.id, 
                    title: d.title, 
                    thumbnail_url: d.thumbnail_url, 
                    client: d.client,
                    link_url: d.link_url || "" 
                });
            });
            setFeaturedList(list);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateLink = async (id: string, url: string) => {
        try {
            await updateDoc(doc(db, "portfolios", id), {
                link_url: url,
            });
            toast.success("링크가 저장되었습니다.");
        } catch (error) {
            console.error(error);
            toast.error("링크 저장 실패");
        }
    };
    
    // ... handleSubmit (omitted for brevity, unchanged logic) ...
// (Wait, `handleSubmit` is needed but not shown in ReplacementContent to avoid replacing too much? 
// No, the tool replaces distinct range. But I need `handleSubmit` to be in scope or defined if I use it?
// The user instruction "EndLine: 210" covers most of the top half. 
// However, simply adding `handleUpdateLink` and `link_url` support is the goal.
// I will provide the updated function definitions and the Portfolio type. 
// I must be careful not to delete `handleSubmit`. 
// Wait, `StartLine: 25`. It replaces everything from Type Def down to `handleRemoveFeatured` usage area?
// Actually, `handleRemoveFeatured` is around line 133.
// The code replacement below covers up to `fetchFeatured` mostly.
// Ah, I need to inject `handleUpdateLink` before the return statement or inside component.
// I will REPLACE from `type Portfolio` down to `handleRemoveFeatured` carefully OR do it in chunks.
// The file is 341 lines.
// Let's replace from `type Portfolio` (Line 25) down to `fetchFeatured` (Line 94).
// And then insert `handleUpdateLink` separately? Or together.
// The safest way is to REPLACE the whole top component logic block.

// Let's try to replace just the needed parts.
// 1. Update Type `Portfolio` (Lines 25-30).
// 2. Update `fetchFeatured` (Lines 81-94).
// 3. Add `handleUpdateLink` (New component logic).
// 4. Update the JSX to show the input.

// Let's do it in ONE large chunk for safety of context.

type Portfolio = {
    id: string;
    title: string;
    thumbnail_url: string;
    client?: string;
    link_url?: string;
};

// ... (skip lines 32-80 which are mostly unchanged except verify fetchData uses correct one) ... 

// Actually, let's just replace the `type Portfolio` definition block and `fetchFeatured` block.

    const fetchFeatured = async () => {
        try {
            const q = query(collection(db, "portfolios"), where("is_featured", "==", true));
            const snap = await getDocs(q);
            const list: Portfolio[] = [];
            snap.forEach(doc => {
                const d = doc.data();
                list.push({ 
                    id: doc.id, 
                    title: d.title, 
                    thumbnail_url: d.thumbnail_url, 
                    client: d.client,
                    link_url: d.link_url || "" // Added
                });
            });
            setFeaturedList(list);
        } catch (error) {
            console.error(error);
        }
    };
    
    // INSERT handleUpdateLink HERE
    const handleUpdateLink = async (id: string, url: string) => {
        try {
            await updateDoc(doc(db, "portfolios", id), {
                link_url: url
            });
            toast.success("링크가 저장되었습니다.");
        } catch (error: any) {
             toast.error("링크 저장 실패: " + error.message);
        }
    };

// And then update the JSX map loop.

// Let's use MultiReplaceFileContent to be precise.

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
    
    const handleUpdateLink = async (id: string, url: string) => {
        try {
            await updateDoc(doc(db, "portfolios", id), {
                link_url: url
            });
            toast.success("링크가 업데이트되었습니다.");
        } catch (error: any) {
            toast.error("링크 업데이트 실패: " + error.message);
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
        <div className="max-w-7xl mx-auto py-12 px-6">
            <h1 className="text-3xl font-serif font-bold mb-8">메인 화면 관리</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Featured Slides (Span 2) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border rounded-xl p-6 shadow-sm min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">슬라이드 목록</h2>
                                <p className="text-sm text-gray-500">메인 상단에 노출될 포트폴리오입니다.</p>
                            </div>
                            <Link href="/admin/portfolio">
                                <Button variant="outline" size="sm">
                                    + 추가하기
                                </Button>
                            </Link>
                        </div>

                        {featuredList.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {featuredList.map((item) => (
                                    <div key={item.id} className="relative group border rounded-lg overflow-hidden bg-gray-50 shadow-sm aspect-square">
                                        {item.thumbnail_url ? (
                                            <div className="relative w-full h-full">
                                                <Image 
                                                    src={item.thumbnail_url} 
                                                    alt={item.title} 
                                                    fill 
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                No Image
                                            </div>
                                        )}
                                        
                                        {/* Overlay Info */}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                                            <h3 className="font-bold text-white text-sm truncate">{item.title}</h3>
                                            <p className="text-xs text-gray-300 truncate">{item.client || "Client"}</p>
                                            {/* Link Input */}
                                            <div className="mt-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Link URL" 
                                                    defaultValue={item.link_url}
                                                    onBlur={(e) => handleUpdateLink(item.id, e.target.value)}
                                                    className="w-full h-6 text-[10px] px-1 rounded bg-white/20 text-white placeholder:text-white/50 border border-white/20 focus:bg-white focus:text-black focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <button 
                                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveFeatured(item.id, item.title)}
                                            title="슬라이드에서 제외"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-lg bg-gray-50/50">
                                <p className="mb-2">등록된 슬라이드가 없습니다.</p>
                                <Link href="/admin/portfolio">
                                    <Button variant="link" className="text-blue-600">포트폴리오에서 추가하기 &rarr;</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Background & Settings (Span 1) */}
                <div className="lg:col-span-1 space-y-6">
                     <div className="bg-white border rounded-xl p-6 shadow-sm sticky top-24">
                        <h2 className="text-xl font-bold mb-1">배경 및 기본 설정</h2>
                        <p className="text-sm text-gray-500 mb-6">배경 영상 및 기본 화면 설정</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* 유튜브 링크 */}
                            <div className="space-y-2">
                                <Label htmlFor="youtube" className="text-xs font-bold uppercase text-gray-500">Youtube Background</Label>
                                <Input 
                                    id="youtube"
                                    placeholder="https://youtu.be/..."
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>

                            {/* 포스터 이미지 */}
                            <div className="space-y-2">
                                 <Label className="text-xs font-bold uppercase text-gray-500">Fallback Poster</Label>
                                 <div
                                    className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
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
                                        <div className="relative w-full aspect-video bg-gray-100 rounded overflow-hidden group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={URL.createObjectURL(newPosterFile!)} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover" 
                                            />
                                            <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                변경하려면 클릭
                                            </div>
                                        </div>
                                    ) : posterUrl ? (
                                        <div className="relative w-full aspect-video bg-gray-100 rounded overflow-hidden group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={posterUrl!} 
                                                alt="Current" 
                                                className="w-full h-full object-cover" 
                                            />
                                            <button 
                                                type="button" 
                                                className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => { e.stopPropagation(); deletePoster(); }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <span className="text-xs text-gray-400">이미지 업로드</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 포스터 링크 */}
                            <div className="space-y-2">
                                <Label htmlFor="linkUrl" className="text-xs font-bold uppercase text-gray-500">Poster Link</Label>
                                <Input 
                                    id="linkUrl"
                                    placeholder="/portfolio"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>

                            {/* 중앙 텍스트 */}
                            <div className="space-y-2">
                                <Label htmlFor="centerText" className="text-xs font-bold uppercase text-gray-500">Center Text</Label>
                                <Textarea 
                                    id="centerText"
                                    placeholder="텍스트 입력..."
                                    className="min-h-[80px] text-sm resize-none"
                                    value={centerText}
                                    onChange={(e) => setCenterText(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full bg-black text-white" disabled={saving}>
                                {saving ? "저장 중..." : "설정 저장"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
