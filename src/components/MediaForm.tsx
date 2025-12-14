"use client";

// 방금 1단계에서 만든 함수를 가져옵니다
import { createMedia } from "@/actions/mediaActions";

export default function MediaForm() {
  return (
    <form
      action={createMedia}
      className="space-y-6 max-w-md mx-auto py-10 bg-white p-8 border border-gray-200 shadow-sm"
    >
      <h2 className="text-xl font-serif font-bold text-center mb-6">
        보도자료 등록
      </h2>

      <div className="space-y-2">
        <label className="text-sm text-gray-500">제목</label>
        <input
          name="title"
          placeholder="예: [부산일보] 아트웨이 개관 소식"
          className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-500">언론사명</label>
        <input
          name="press_name"
          placeholder="예: 부산일보"
          className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-500">기사 링크 (URL)</label>
        <input
          name="link_url"
          placeholder="https://..."
          className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition"
          required
        />
      </div>

      <button
        type="submit"
        className="bg-black text-white w-full py-4 font-bold hover:bg-gray-800 transition"
      >
        등록하기
      </button>
    </form>
  );
}
