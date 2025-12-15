"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/login"); // Redirect if not logged in
            } else {
                setUser(user);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-400 font-serif">Verifying Access...</p>
            </div>
        );
    }
    
    // If not user (and finished loading), handled by redirect, but return null
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            {/* Admin Header / Nav */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/admin" className="font-serif font-bold text-xl">
                            ADMIN
                        </Link>
                        <nav className="flex gap-6 text-sm font-medium text-gray-500">
                            <Link
                                href="/admin"
                                className="hover:text-black transition-colors"
                            >
                                대시보드
                            </Link>
                            <Link
                                href="/admin/main"
                                className="hover:text-black transition-colors"
                            >
                                메인 관리
                            </Link>
                            {/* <Link
                                href="/admin/exhibition"
                                className="hover:text-black transition-colors"
                            >
                                전시 관리
                            </Link> */}
                            <Link
                                href="/admin/portfolio"
                                className="hover:text-black transition-colors"
                            >
                                포트폴리오 관리
                            </Link>
                            <Link
                                href="/admin/media"
                                className="hover:text-black transition-colors"
                            >
                                언론보도 관리
                            </Link>
                            <Link
                                href="/admin/inquiry"
                                className="hover:text-black transition-colors"
                            >
                                문의 관리
                            </Link>
                            {/* <Link
                                href="/admin/library"
                                className="hover:text-black transition-colors"
                            >
                                미디어 라이브러리
                            </Link> */}
                            <Link
                                href="/admin/settings"
                                className="hover:text-black transition-colors"
                            >
                                사이트 설정
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                나가기
                            </Button>
                        </Link>
                        <LogoutButton />
                    </div>
                </div>
            </div>

            {children}
        </div>
    );
}
