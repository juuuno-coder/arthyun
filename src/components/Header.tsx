// src/components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import MobileMenu from "@/components/MobileMenu";

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/"; // 메인 페이지 여부 확인
  
  // 스크롤 감지 (스크롤 내리면 배경색 채우기)
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 스타일 분기 처리
  const headerClass = isHome && !isScrolled
    ? "bg-transparent border-transparent text-white" // 메인 & 스크롤Top: 투명 배경, 흰 글씨
    : "bg-white/90 backdrop-blur-sm border-gray-100/50 text-gray-500"; // 그 외: 흰 배경, 검은 글씨

  const logoSrc = isHome && !isScrolled 
    ? "/logo-white.png" // (선택사항) 배경이 어두우니 흰색 로고가 있다면 교체
    : "/logo.png";      // 기존 로고

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${headerClass}`}>
      <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="relative h-8 md:h-10 w-40 flex items-center hover:opacity-70 transition group">
           <Image
            src="/images/logo-light.png"
            alt="ART HYUN"
            fill
            className={`object-contain transition-opacity duration-300 ${isHome && !isScrolled ? "opacity-100" : "opacity-0"}`}
            priority
            sizes="(max-width: 768px) 120px, 160px"
          />
           <Image
            src="/images/logo-dark.png"
            alt="ART HYUN"
            fill
            className={`object-contain transition-opacity duration-300 ${isHome && !isScrolled ? "opacity-0" : "opacity-100"}`}
            priority
            sizes="(max-width: 768px) 120px, 160px"
          />
        </Link>

        {/* 네비게이션 */}
        {/* bg-white 제거함 */}
        {/* 네비게이션 */}
        <nav className={`hidden md:flex gap-12 text-[16px] font-medium tracking-widest ${isHome && !isScrolled ? "text-white/80 hover:text-white" : "text-gray-500"}`}>
          <Link href="/about" className="hover:text-black hover:opacity-100 transition-colors">ABOUT</Link>
          <Link href="/portfolio" className="hover:text-black hover:opacity-100 transition-colors">PORTFOLIO</Link>
          <Link href="/archive" className="hover:text-black hover:opacity-100 transition-colors">ARCHIVE</Link>
          <Link href="/media" className="hover:text-black hover:opacity-100 transition-colors">MEDIA</Link>
          <Link href="/mall" className="hover:text-black hover:opacity-100 transition-colors">SHOP</Link>
          <Link href="/contact" className="hover:text-black hover:opacity-100 transition-colors">CONTACT</Link>
        </nav>

        {/* 모바일 메뉴 (색상 props 전달 필요할 수 있음) */}
        <div className={`md:hidden ${isHome && !isScrolled ? "text-white" : "text-black"}`}>
           <MobileMenu />
        </div>
      </div>
    </header>
  );
}