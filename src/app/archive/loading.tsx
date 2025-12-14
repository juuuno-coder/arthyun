
export default function Loading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 mt-8 py-12 md:py-20 relative animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end mb-12 border-b border-gray-200 pb-4">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {/* 스켈레톤 아이템 8개 표시 */}
        {[...Array(8)].map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/4] bg-gray-200 mb-4 rounded-sm"></div>
            <div className="h-6 w-3/4 bg-gray-200 mb-2 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
