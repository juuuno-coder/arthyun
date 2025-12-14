"use client";
// ... import 문 생략
import { useRouter, useSearchParams } from "next/navigation";

export default function ArchiveGrid({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modalId = searchParams.get("exhibitionId");

  // 전시 클릭 시 URL 변경 (모달 오픈 효과)
  const openModal = (id: string) => {
    router.push(`/archive?exhibitionId=${id}`, { scroll: false });
  };

  // 모달 닫기
  const closeModal = () => {
    router.push("/archive", { scroll: false });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {initialData.map((item) => (
          <div
            key={item.id}
            onClick={() => openModal(item.id)}
            className="cursor-pointer group"
          >
            <div className="aspect-[3/4] relative overflow-hidden bg-gray-100 mb-4">
              {/* 이미지 렌더링 */}
            </div>
            <h3 className="font-bold text-lg group-hover:text-blue-600 transition">
              {item.title}
            </h3>
            <p className="text-sm text-gray-500">{item.subtitle}</p>
          </div>
        ))}
      </div>

      {/* 모달: modalId가 존재하면 렌더링 */}
      {modalId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 상세 정보 Fetching 및 표시 로직 */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-black"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
