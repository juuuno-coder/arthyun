"use client";

import Link from "next/link";
import { Instagram } from "lucide-react";

export default function InstagramBanner() {
  return (
    <Link
      href="https://www.instagram.com/artwaygallery_story/"
      target="_blank"
      className="group flex items-center justify-between w-full max-w-sm mx-auto bg-white border border-gray-200 rounded-full py-2 pl-6 pr-2 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300"
    >
      {/* 왼쪽: 아이디 + 아이콘 */}
      <div className="flex items-center gap-2.5">
        <Instagram size={20} className="text-gray-400 group-hover:text-pink-500 transition-colors" />
        <span className="font-bold text-base text-gray-900 tracking-tight">
          artwaygallery_story
        </span>
      </div>

      {/* 오른쪽: 팔로우 버튼 (인스타 고유 색상 #0095f6) */}
      <div className="bg-[#0095f6] text-white text-sm font-semibold px-5 py-2 rounded-full group-hover:bg-[#1877f2] transition-colors shadow-sm">
        팔로우
      </div>
    </Link>
  );
}