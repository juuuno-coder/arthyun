export default function Loading() {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
        <div className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase animate-pulse">
            Loading Artway
        </div>
      </div>
    );
  }
