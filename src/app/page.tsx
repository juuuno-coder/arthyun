import { supabase } from "@/lib/supabase";
import MainSlider from "@/components/MainSlider"; 
import MainBackground from "@/components/MainBackground";

// 데이터가 계속 바뀌므로 캐싱하지 않음 (새로고침 시 즉시 반영)
export const dynamic = "force-dynamic";

export default async function HomePage() {
  console.log("--------------- [메인 페이지 로드 시작] ---------------");

  try {
    // 1. 포트폴리오 데이터 가져오기 (메인 슬라이더용) - 잠시 연동 해제
    // ... (commented out code) ...
    
    // 임시로 슬라이더 데이터 비움
    const slides: any[] = [];

    // 2. 메인 페이지 설정 가져오기 (배경, 텍스트)
    const { data: mainSettings } = await supabase
        .from("main_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
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
                        <div className="relative max-w-full flex items-center justify-center">
                            {mainSettings.link_url ? (
                                <a href={mainSettings.link_url} className="cursor-pointer hover:opacity-90 transition-opacity">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={mainSettings.poster_url} 
                                        alt="Main Poster" 
                                        className="max-w-[400px] md:max-w-[500px] max-h-[50vh] object-contain drop-shadow-2xl"
                                    />
                                </a>
                            ) : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img 
                                    src={mainSettings.poster_url} 
                                    alt="Main Poster" 
                                    className="max-w-[400px] md:max-w-[500px] max-h-[50vh] object-contain drop-shadow-2xl"
                                />
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
    // ... existing error handler
    console.error("CRITICAL ERROR IN PAGE:", error);
    // [Safety Fallback]
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-10 text-center">
            {/* ... fallback content ... */}
             <h1 className="text-4xl font-serif mb-4">Art Hyun</h1>
             <p className="text-gray-400 mb-8">System Maintenance</p>
             <p className="text-xs text-red-500">{error.message}</p>
        </div>
    );
  }
}