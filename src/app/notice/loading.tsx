export default function Loading() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-24 min-h-screen">
      <div className="mb-16">
        <div className="h-10 md:h-12 w-48 bg-gray-200 animate-pulse rounded mb-6"></div>
        <div className="h-6 w-64 bg-gray-100 animate-pulse rounded"></div>
      </div>

      <div className="border-t border-black">
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="block py-8 px-2">
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-2">
                <div className="h-7 w-1/3 bg-gray-100 animate-pulse rounded"></div>
                <div className="h-5 w-24 bg-gray-50 animate-pulse rounded"></div>
              </div>
              <div className="h-5 w-2/3 bg-gray-50 animate-pulse rounded mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
