import MediaForm from "@/components/MediaForm";

export default function MediaWritePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* 2단계에서 만든 폼 컴포넌트를 여기에 배치 */}
      <MediaForm />
    </div>
  );
}
