// src/app/admin/exhibition/write/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createExhibition } from "@/actions/exhibitionActions";
import dynamicImport from "next/dynamic";
import { Button } from "@/components/ui/button"; // shadcn 버튼 적용

// Editor를 동적으로 import (SSR 방지)
const Editor = dynamicImport(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => <div className="min-h-[200px] border rounded-md p-4 flex items-center justify-center text-gray-400">에디터 로딩 중...</div>
});

// 정적 생성 방지 (클라이언트 전용 컴포넌트)
export const dynamic = "force-dynamic";

export default function AdminExhibitionWrite() {
  const [descHtml, setDescHtml] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 로딩 상태 처리
  const router = useRouter(); // 라우터 사용

  const handleSubmit = async (formData: FormData) => {
    // 1. 파일 용량 사전 체크 (서버 제한 10MB 방지)
    const file = formData.get("poster_image") as File;
    if (file && file.size > 10 * 1024 * 1024) { // 10MB
      alert("이미지 용량이 너무 큽니다. 10MB 이하의 파일을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createExhibition(formData);
      
      if (result.success) {
        alert("전시가 성공적으로 등록되었습니다.");
        router.push("/admin/exhibition");
      } else {
        alert(result.message || "전시 등록에 실패했습니다.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("알 수 없는 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-20 px-6 animate-fade-in-up">
      <h1 className="text-3xl font-serif font-bold mb-10 border-b pb-4">
        전시 등록 (Admin)
      </h1>

      <form action={handleSubmit} className="space-y-8">
        {/* 1. 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">전시 제목 *</label>
            <input
              name="title"
              type="text"
              className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">
              작가명 (부제목)
            </label>
            <input
              name="subtitle"
              type="text"
              className="w-full border-b border-gray-300 p-2 focus:outline-none focus:border-black transition"
            />
          </div>
        </div>

        {/* 2. 날짜 및 옵션 */}
        {/* 2. 날짜 설정 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">시작일</label>
            <input
              name="start_date"
              type="date"
              className="w-full border-b border-gray-300 p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">종료일</label>
            <input
              name="end_date"
              type="date"
              className="w-full border-b border-gray-300 p-2"
            />
          </div>
        </div>

        {/* 3. 메인 슬라이더 옵션 (유튜브 배경) */}
        <div className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row gap-4 md:items-center border border-gray-200">
          <div className="flex items-center gap-2 shrink-0">
            <input
              name="is_main_slider"
              type="checkbox"
              id="main_check"
              className="w-5 h-5 accent-black cursor-pointer"
            />
            <label
              htmlFor="main_check"
              className="text-sm font-bold cursor-pointer"
            >
              메인 슬라이더 노출
            </label>
          </div>
          
          <div className="flex-1">
             <input
               name="youtube_url"
               type="text"
               placeholder="유튜브 영상 URL (메인 슬라이더 배경으로 사용시 입력)"
               className="w-full bg-transparent border-b border-gray-300 p-2 text-sm focus:outline-none focus:border-black"
             />
          </div>
        </div>

        {/* 3. 포스터 이미지 */}
        <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300">
          <label className="block text-sm font-bold mb-2">
            대표 포스터 이미지 *
          </label>
          <input
            name="poster_image"
            type="file"
            accept="image/*"
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer"
            required
          />
        </div>

        {/* 4. 상세 내용 (Editor) */}
        <div>
          <label className="block text-sm font-bold mb-2">전시 상세 설명</label>
          <div className="min-h-[400px] border rounded-md p-1">
            <Editor
              onChange={(html: string) => {
                // console.log("HTML Changed:", html); // 디버깅용
                setDescHtml(html);
              }}
            />
          </div>
          <input type="hidden" name="description" value={descHtml} />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-6 text-lg font-bold hover:bg-gray-800 transition"
        >
          {isLoading ? "업로드 중..." : "전시 등록하기"}
        </Button>
      </form>
    </div>
  );
}
