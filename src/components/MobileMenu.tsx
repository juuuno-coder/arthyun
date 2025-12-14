"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X, Instagram, Youtube, Library } from "lucide-react";

export default function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // 메뉴 열렸을 때 스크롤 방지
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    // PortalContent: 메뉴 오버레이 내용
    const menuOverlay = (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm animate-fade-in flex flex-col gap-8">
            {/* 상단 닫기 버튼 */}
            <div className="h-16 px-6 flex items-center justify-between">
                <span className="font-serif font-bold text-lg"></span>
                <button
                    onClick={closeMenu}
                    className="p-2 -mr-2 text-gray-800 hover:text-black transition"
                    aria-label="메뉴 닫기"
                >
                    <X size={28} />
                </button>
            </div>

            {/* 메뉴 링크들 */}
            <nav className="flex-1 flex flex-col justify-center items-center gap-10 text-2xl font-serif text-gray-900">
                <Link href="/about" onClick={closeMenu} className="hover:text-blue-600 transition-colors uppercase tracking-[0.2em] font-medium text-xl">
                    ABOUT
                </Link>
                <Link href="/portfolio" onClick={closeMenu} className="hover:text-blue-600 transition-colors uppercase tracking-[0.2em] font-medium text-xl">
                    PORTFOLIO
                </Link>
                <Link href="/archive" onClick={closeMenu} className="hover:text-blue-600 transition-colors uppercase tracking-[0.2em] font-medium text-xl">
                    ARCHIVE
                </Link>
                <Link href="/media" onClick={closeMenu} className="hover:text-blue-600 transition-colors uppercase tracking-[0.2em] font-medium text-xl">
                    MEDIA
                </Link>
                <Link href="/mall" onClick={closeMenu} className="hover:text-blue-600 transition-colors uppercase tracking-[0.2em] font-medium text-xl">
                    SHOP
                </Link>
                <Link href="/contact" onClick={closeMenu} className="hover:text-blue-600 transition-colors uppercase tracking-[0.2em] font-medium text-xl">
                    CONTACT
                </Link>
            </nav>

            {/* 하단 소셜 링크 */}
            <div className="pb-12 flex gap-8 justify-center text-gray-500">
                <a
                    href="https://www.instagram.com/artwaygallery_story/"
                    target="_blank"
                    className="hover:text-black transition-colors"
                >
                    <Instagram size={28} />
                </a>
                <a
                    href="https://blog.naver.com/art_way_"
                    target="_blank"
                    className="hover:text-black transition-colors"
                >
                    <Library size={28} />
                </a>
                <a
                    href="https://www.youtube.com/@artwaygallerybusan"
                    target="_blank"
                    className="hover:text-black transition-colors"
                >
                    <Youtube size={28} />
                </a>
            </div>
        </div>
    );

    return (
        <div className="md:hidden">
            {/* 햄버거 버튼 */}
            <button
                onClick={toggleMenu}
                className="p-2 -mr-2 text-inherit hover:opacity-70 transition" // 부모 색상 상속
                aria-label="메뉴 열기"
            >
                <Menu size={24} />
            </button>

            {/* 포탈을 통해 body에 렌더링 (헤더 스타일 영향 받지 않음) */}
            {isOpen && mounted && createPortal(menuOverlay, document.body)}
        </div>
    );
}
