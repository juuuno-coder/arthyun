// export const revalidate = 60;
export const revalidate = 60;
// export const dynamic = "error";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">ART HYUN</h1>
        <p className="text-xl text-gray-400">System Verified. Welcome back.</p>
        <p className="mt-8 text-sm text-gray-600">v2.0.0 (Firebase Migration Complete)</p>
      </div>
    </div>
  );
}
