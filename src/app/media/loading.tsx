
export default function Loading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-6 mt-8 py-12 md:py-20 space-y-24 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
      </div>

      {/* List Skeleton */}
      <div className="space-y-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col md:flex-row gap-6 border-b border-gray-100 py-6">
            {/* Image Skeleton */}
            <div className="w-full md:w-48 aspect-video shrink-0 bg-gray-200 rounded-md"></div>
            
            {/* Text Skeleton */}
            <div className="flex-1 flex flex-col justify-between py-1 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
              </div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
