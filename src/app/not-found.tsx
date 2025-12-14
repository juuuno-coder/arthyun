import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-black text-center p-6">
      <h1 className="text-9xl font-serif font-black mb-4 opacity-10">404</h1>
      <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
      <p className="text-gray-500 mb-10 max-w-md">
        요청하신 페이지를 찾을 수 없습니다. <br />
        입력하신 주소가 정확한지 다시 한번 확인해 주세요.
      </p>
      <Link 
        href="/" 
        className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition rounded-full text-sm font-medium tracking-wide"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
