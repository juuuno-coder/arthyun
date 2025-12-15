
export const revalidate = 60;

export default function HomePage() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
      <h1 className="text-4xl text-white">Maintenance Mode (Test)</h1>
      <p>Site is updating...</p>
    </div>
  );
}