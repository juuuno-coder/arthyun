import { supabase } from "@/lib/supabase";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* 1. Intro Section */}
      <div className="max-w-[1280px] mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
        
        {/* Logo Image moved here */}
        <div className="w-full max-w-lg mb-12 animate-fade-in-up">
            <Image 
                src="/images/about/logo_detail.png" 
                alt="Art Hyun Logo Detail" 
                width={800} 
                height={400}
                className="w-full h-auto object-contain"
                priority
            />
        </div>

        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-8 tracking-widest uppercase animate-fade-in-up delay-100">
          ART HYUN
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 font-light mb-12 animate-fade-in-up delay-200">
          예술로 여는 도시재생
        </p>
        <div className="w-20 h-[1px] bg-black mb-12 animate-fade-in-up delay-300"></div>
        <div className="max-w-3xl text-lg text-gray-600 leading-loose mx-auto animate-fade-in-up delay-400">
            <p className="mb-6">
                아트현은 공공미술, 공공디자인, 벽화 등 다양한 예술활동을 통해 도시의 이야기를 시각화하고, 
                지역사회에 활력을 불어넣은 <strong>문화예술 전문 사회적기업</strong>입니다.
            </p>
            <p>
                단순한 환경 개선을 넘어, 예술이 가진 힘으로 공간의 가치를 재발견하고, 
                주민들의 삶 속에 스며드는 따뜻한 문화를 만들어 갑니다.
            </p>
        </div>
      </div>

      {/* 2. Team Cards Section (Image) */}
      <div className="bg-gray-50 py-20">
          <div className="max-w-[1280px] mx-auto px-6">
              <h2 className="text-3xl font-serif font-bold text-center mb-12">OUR TEAM</h2>
              <div className="w-full flex justify-center">
                  <Image 
                      src="/images/about/team_cards.png" 
                      alt="Art Hyun Team" 
                      width={1200} 
                      height={600}
                      className="w-full max-w-5xl h-auto object-contain shadow-lg rounded-lg hover:scale-[1.01] transition duration-500"
                  />
              </div>
          </div>
      </div>

      {/* 3. History Timeline Section (Image) */}
      <div className="py-20 md:py-32">
          <div className="max-w-[1280px] mx-auto px-6">
              <h2 className="text-3xl font-serif font-bold text-center mb-16">HISTORY</h2>
              <div className="w-full flex justify-center">
                  <Image 
                      src="/images/about/history_timeline.png" 
                      alt="Art Hyun History Timeline" 
                      width={800} 
                      height={1000}
                      className="w-full max-w-xl h-auto object-contain"
                  />
              </div>
          </div>
      </div>
    </div>
  );
}