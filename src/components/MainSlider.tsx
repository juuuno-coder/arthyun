"use client";

import { useState } from "react";
// import Image from "next/image"; // 사용하지 않음
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function MainSlider({ exhibitions, fallbackYoutubeUrl }: { exhibitions: any[], fallbackYoutubeUrl?: string | null }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? exhibitions.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === exhibitions.length - 1 ? 0 : prev + 1));
  };

  const current = exhibitions[currentIndex];

  // 유튜브 ID 추출
  const getYoutubeId = (url: string | null | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const currentYoutubeId = getYoutubeId(current.youtube_url || fallbackYoutubeUrl);

  return (
    <div className="relative w-full h-full flex items-center justify-center block-select-none">
      
      {/* 📺 [배경 레이어] 제거됨 (상위 page.tsx에서 MainBackground로 처리) */}

      {/* 🧭 [네비게이션 버튼] */}
      <button onClick={prevSlide} className="absolute left-4 md:left-10 z-20 text-white/50 hover:text-white transition">
        <ChevronLeft size={40} strokeWidth={1} />
      </button>
      <button onClick={nextSlide} className="absolute right-4 md:right-10 z-20 text-white/50 hover:text-white transition">
        <ChevronRight size={40} strokeWidth={1} />
      </button>

      {/* 📝 [컨텐츠 영역] 위치 조정 (기존보다 약간 위로: translate-y 감소) */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-6 animate-fade-in translate-y-8 md:translate-y-16">
        
        {current.link_url ? (
             <Link href={current.link_url} className="group flex flex-col items-center cursor-pointer">
                 {/* 1. 포스터 이미지 (사이즈 축소: 88% 수준) */}
                {current.poster_url && (
                  <div className="relative w-[180px] h-[250px] md:w-[260px] md:h-[350px] mb-3 transition-transform duration-300 group-hover:scale-105">
                    <img
                      src={current.poster_url}
                      alt={current.title}
                      className="w-full h-full object-contain object-bottom drop-shadow-2xl"
                    />
                  </div>
                )}

                {/* 제목 (메뉴명과 동일 폰트, 한 단계 작게) */}
                <h2 className="text-xl md:text-3xl font-sans font-bold text-white mb-6 drop-shadow-md tracking-widest uppercase transition-colors group-hover:text-gray-200">
                  {current.title}
                </h2>
             </Link>
        ) : (
            <>
                {/* 1. 포스터 이미지 (사이즈 축소: 88% 수준) */}
                {current.poster_url && (
                  <div className="relative w-[180px] h-[250px] md:w-[260px] md:h-[350px] mb-3">
                    <img
                      src={current.poster_url}
                      alt={current.title}
                      className="w-full h-full object-contain object-bottom drop-shadow-2xl"
                    />
                  </div>
                )}

                {/* 제목 (메뉴명과 동일 폰트, 한 단계 작게) */}
                <h2 className="text-xl md:text-3xl font-sans font-bold text-white mb-6 drop-shadow-md tracking-widest uppercase">
                  {current.title}
                </h2>
            </>
        )}

        {/* 전시 기간 */}
        <p className="text-xs md:text-sm text-gray-400 mb-8 font-light tracking-wider opacity-80">
          {current.start_date && current.end_date 
            ? `${current.start_date.replace(/-/g, '.')} ~ ${current.end_date.replace(/-/g, '.')}`
            : ""}
        </p>
      </div>
    </div>
  );
}