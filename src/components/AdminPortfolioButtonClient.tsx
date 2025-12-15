"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Settings } from "lucide-react";

export default function AdminPortfolioButtonClient() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAdmin(!!user);
        });
        return () => unsubscribe();
    }, []);

    if (!isAdmin) return null;

    return (
        <Link href="/admin/portfolio">
            <Button variant="outline" className="gap-2 border-black hover:bg-black hover:text-white transition-colors">
                <Settings size={16} />
                <span>관리자 모드</span>
            </Button>
        </Link>
    );
}
