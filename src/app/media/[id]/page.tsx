// src/app/media/[id]/page.tsx
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ExternalLink, Calendar, Newspaper } from "lucide-react";

// 페이지 캐싱 방지
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MediaDetailPage({ params }: Props) {
  const { id } = await params; // Next.js 16: params를 await로 unwrap

  // 1. DB에서 ID로 게시물 찾기
  const { data: post, error } = await supabase
    .from("media_releases")
    .select("*")
    .eq("id", id)
    .single();

  // 2. 데이터가 없거나 에러나면 404 처리
  if (error || !post) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-fade-in-up">
      {/* 뒤로가기 버튼 */}
      <div className="mb-8">
        <Button
          variant="ghost"
          asChild
          className="pl-0 hover:bg-transparent hover:text-gray-500"
        >
          <Link href="/media">
            <ArrowLeft className="mr-2 h-4 w-4" /> 목록으로 돌아가기
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-none">
        <CardHeader className="p-0 mb-8 space-y-4">

          <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight text-gray-900">
            {post.title}
          </h1>
        </CardHeader>

        <Separator className="my-8" />

        <CardContent className="p-0">
          {/* 대표 이미지는 상세 페이지에서 제외 (사용자가 본문에 직접 삽입함) */}
          
          {/* 상단 메타 정보 (날짜 등) - 카드 헤더 아래로 이동 가능하지만 일단 디자인 유지 */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-8">
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-gray-700 font-medium">
              <Newspaper size={14} />
              {post.press_name || "Press"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {/* 기사 게시일(published_date) 우선, 없으면 등록일(created_at) */}
              {post.published_date 
                ? new Date(post.published_date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
                : new Date(post.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>

          {/* 에디터로 작성한 HTML 내용 렌더링 */}
          {/* prose: Tailwind Typography 플러그인 스타일 (없어도 기본 스타일 적용됨) */}
          <div
            className="prose max-w-none text-gray-700 leading-loose text-lg min-h-[200px]"
            dangerouslySetInnerHTML={{
              __html: post.content || "<p>내용이 없습니다.</p>",
            }}
          />

          {/* 하단 링크 버튼 영역 */}
          <div className="mt-16 flex justify-center">
            <Button
              asChild
              size="lg"
              className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-lg rounded-full shadow-lg transition-transform hover:-translate-y-1"
            >
              <Link href={post.link_url} target="_blank">
                기사 원문 보러가기 <ExternalLink className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
