"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, ArrowUpRight } from "lucide-react";

export default function InstagramProfile() {
  return (
    <div className="w-full max-w-4xl mx-auto border border-gray-100 rounded-2xl p-8 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex flex-col md:flex-row items-center gap-8">
        
        {/* 1. 프로필 이미지 (로고나 갤러리 사진 사용) */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
          <div className="w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
            <div className="w-full h-full rounded-full bg-white p-1 overflow-hidden relative">
              {/* 여기에 public 폴더의 로고나 갤러리 사진을 넣으세요 */}
              <Image 
                src="/about-image.jpg" // 아까 저장한 갤러리 사진 혹은 로고 경로
                alt="Profile" 
                fill 
                className="object-cover rounded-full"
              />
            </div>
          </div>
        </div>

        {/* 2. 텍스트 정보 */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-center md:justify-start">
            <h2 className="text-xl font-bold text-gray-900">artwaygallery_story</h2>
            
            {/* 팔로우 버튼 */}
            <Link 
              href="https://www.instagram.com/artwaygallery_story/" 
              target="_blank"
              className="px-6 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
            >
              <Instagram size={16} />
              팔로우
            </Link>
          </div>

          {/* 스탯 (게시물/팔로워) */}
          <div className="flex items-center justify-center md:justify-start gap-8 text-sm md:text-base">
            <p>게시물 <span className="font-bold">42</span></p>
            <p>팔로워 <span className="font-bold">418</span></p>
            <p>팔로우 <span className="font-bold">421</span></p>
          </div>

          {/* 소개글 */}
          <div className="text-sm leading-relaxed text-gray-600">
            <p className="font-bold text-gray-900 mb-1">아트웨이갤러리</p>
            <p>부산광역시 동구 정공단로9 1F-3F</p>
            <p>➡️ 고석원초대개인전 &apos;Docking&apos;</p>
            <p>2025.10.29.수 ~ 11.20.목 (매주 월,화 휴관)</p>
            <p>⏰ 11:00-18:00</p>
            <p>☎️ 051)915-8385</p>
          </div>
        </div>
      </div>

      {/* 하단 바로가기 링크 */}
      <Link 
        href="https://www.instagram.com/artwaygallery_story/" 
        target="_blank"
        className="mt-8 flex items-center justify-center w-full py-4 border-t border-gray-100 text-sm font-medium text-gray-500 hover:text-blue-500 transition gap-1 group"
      >
        인스타그램 방문하기
        <ArrowUpRight size={16} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}