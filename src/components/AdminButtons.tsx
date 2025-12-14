"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// 전시 관리 버튼
export function AdminExhibitionButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 세션 체크
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsAdmin(true);
    });
  }, []);

  if (!isAdmin) return null;

  return (
    <Button asChild className="bg-black text-white hover:bg-gray-800 gap-2">
      <Link href="/admin/exhibition">
        <Plus size={16} /> 전시 등록 및 관리
      </Link>
    </Button>
  );
}

// 미디어 관리 버튼
export function AdminMediaButton() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsAdmin(true);
    });
  }, []);

  if (!isAdmin) return null;

  return (
    <Button asChild className="bg-black text-white hover:bg-gray-800 gap-2">
      <Link href="/admin/media">
        <Plus size={16} /> 보도자료 등록 및 관리
      </Link>
    </Button>
  );
}

// 포트폴리오 관리 버튼
export function AdminPortfolioButton() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsAdmin(true);
    });
  }, []);

  if (!isAdmin) return null;

  return (
    <Button asChild className="bg-black text-white hover:bg-gray-800 gap-2">
      <Link href="/admin/portfolio">
        <Plus size={16} /> 포트폴리오 등록 및 관리
      </Link>
    </Button>
  );
}
