"use client";

import Link from "next/link";
import { Instagram, Youtube, BookOpen } from "lucide-react"; // Blog 아이콘으로 BookOpen 사용

export default function SocialConnect() {
  const socialLinks = [
    {
      name: "Instagram",
      id: "@art_hyun",
      url: "https://www.instagram.com/art_hyun/",
      icon: <Instagram size={24} />,
      color: "text-pink-600",
      bgHover: "hover:border-pink-200 hover:shadow-pink-100",
      btnColor: "bg-pink-600 hover:bg-pink-700",
    },
    {
      name: "Naver Blog",
      id: "blog.naver.com/arthyunn",
      url: "https://blog.naver.com/arthyunn",
      icon: <BookOpen size={24} />, 
      color: "text-green-600",
      bgHover: "hover:border-green-200 hover:shadow-green-100",
      btnColor: "bg-green-500 hover:bg-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
      {socialLinks.map((social) => (
        <Link
          key={social.name}
          href={social.url}
          target="_blank"
          className={`group flex flex-col items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl shadow-sm transition-all duration-300 ${social.bgHover} hover:-translate-y-1`}
        >
          {/* 아이콘 + 이름 */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className={`p-3 rounded-full bg-gray-50 group-hover:bg-white transition-colors ${social.color}`}>
              {social.icon}
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900">{social.name}</p>
              <p className="text-xs text-gray-400 mt-1">{social.id}</p>
            </div>
          </div>

          {/* 바로가기 버튼 */}
          <div className={`text-white text-xs font-bold px-6 py-2 rounded-full transition-colors ${social.btnColor}`}>
            바로가기
          </div>
        </Link>
      ))}
    </div>
  );
}