
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit, where } from "firebase/firestore";
import MainSlider from "@/components/MainSlider"; 
import MainBackground from "@/components/MainBackground";
import Image from "next/image";
import Link from "next/link";

// 1분마다 갱신 (ISR) - 성능 최적화
export const revalidate = 60;
// export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const slides: any[] = []; 

    // 1. Fetch Featured Portfolios for Main Slider
    try {
        const q = query(
            collection(db, "portfolios"),
            where("is_featured", "==", true)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
            snap.docs.forEach(doc => {
                 const data = doc.data();
                 slides.push({
                     id: doc.id,
                     ...data,
                     // Map Portfolio fields to MainSlider expected fields
                     poster_url: data.thumbnail_url, 
                     artist: data.client || data.artist || "ART HYUN",
                     start_date: data.completion_date || data.created_at?.substring(0, 10),
                     end_date: null 
                 });
            });
        }
    } catch (e) {
        console.error("Firebase featured portfolios fetch error:", e);
    }

    // 2. 메인 설정 가져오기 (배경, 텍스트)
    let mainSettings: any = null;
    try {
        const q = query(collection(db, "main_settings"), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
            mainSettings = snap.docs[0].data();
        }
    } catch (e) {
        console.error("Firebase main_settings fetch error:", e);
    }

    return (
        <div className="relative w-full aspect-video bg-black overflow-hidden">
            {/* 배경 비디오 (항상 표시) */}
            <MainBackground youtubeUrl={mainSettings?.youtube_url} />

            <div className="relative z-10 h-full w-full pt-16">
                {slides.length > 0 ? (
                <MainSlider 
                    exhibitions={slides} 
                />
                ) : (
                <div className="h-full flex flex-col items-center justify-center text-white/80 gap-8 text-center px-4 animate-fade-in">
                    {/* 1. 포스터 이미지 (링크 연결 및 사이즈 축소) */}
                    {mainSettings?.poster_url && (
                        <div className="relative w-full max-w-[400px] md:max-w-[500px] h-[50vh] flex items-center justify-center">
                            {mainSettings.link_url ? (
                                <a href={mainSettings.link_url} className="relative w-full h-full block hover:opacity-90 transition-opacity">
                                    <Image 
                                        src={mainSettings.poster_url} 
                                        alt="Main Poster" 
                                        fill
                                        className="object-contain drop-shadow-2xl"
                                        sizes="(max-width: 768px) 90vw, 500px"
                                        priority
                                    />
                                </a>
                            ) : (
                                <div className="relative w-full h-full">
                                    <Image 
                                        src={mainSettings.poster_url} 
                                        alt="Main Poster" 
                                        fill
                                        className="object-contain drop-shadow-2xl"
                                        sizes="(max-width: 768px) 90vw, 500px"
                                        priority
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. 중앙 텍스트 (포스터 유무와 관계없이 표시) */}
                    {mainSettings?.center_text ? (
                        <p className="text-base md:text-xl font-medium tracking-widest leading-relaxed whitespace-pre-wrap drop-shadow-lg max-w-3xl">
                            {mainSettings.center_text}
                        </p>
                    ) : !mainSettings?.poster_url && (
                        /* 포스터도 없고 텍스트도 없을 때만 기본 문구 표시 */
                        <>
                            <p className="text-lg font-light tracking-widest text-white/40">EXHIBITION PREPARING</p>
                            <p className="text-xs text-white/30">현재 진행 중인 전시가 준비 중입니다.</p>
                        </>
                    )}
                </div>
                )}
            </div>
        </div>
    );
  } catch (error: any) {
    console.error("CRITICAL ERROR IN PAGE:", error);
    // [Safety Fallback]
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-10 text-center">
             <h1 className="text-4xl font-serif mb-4">Art Hyun</h1>
             <p className="text-gray-400 mb-8">System Maintenance</p>
             <p className="text-xs text-red-500">{error.message}</p>
        </div>
    );
  }
}
