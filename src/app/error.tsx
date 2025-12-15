"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6">
      <h2 className="text-3xl font-serif font-bold mb-4">앗! 문제가 발생했습니다.</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        일시적인 오류일 수 있습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
      </p>
      
      <div className="space-x-4">
          <button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
            className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition rounded-md"
          >
            다시 시도하기
          </button>
          <a
             href="/"
             className="px-6 py-3 border border-gray-300 hover:bg-gray-50 transition rounded-md inline-block"
          >
            홈으로 가기
          </a>
      </div>
    </div>
  );
}
