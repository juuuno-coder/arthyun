import { ShoppingBag, Clock } from "lucide-react";
import Link from "next/link";

export default function MallPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-50">
      
      {/* Background Text Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-black text-gray-100 select-none whitespace-nowrap pointer-events-none">
        COMING SOON
      </div>

      <div className="relative z-10 max-w-lg w-full px-6 text-center">
        <div className="bg-white p-12 rounded-2xl shadow-xl border border-gray-100 animate-fade-in-up">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <ShoppingBag size={28} />
            </div>

            <span className="text-xs font-bold tracking-[0.3em] text-blue-600 uppercase mb-4 block">
                ART HYUN SHOP
            </span>

            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-gray-900">
                Opening Soon
            </h1>

            <div className="w-12 h-0.5 bg-gray-200 mx-auto mb-6"></div>

            <p className="text-gray-500 leading-loose mb-10 font-light">
                아트현과 함께하는 작가들의 독창적인 굿즈와 <br className="hidden md:block"/>
                예술 작품을 만날 수 있는 온라인 스토어를 준비하고 있습니다.<br />
                조금만 기다려주세요.
            </p>

            <Link href="/contact" className="block w-full py-4 border border-gray-200 text-xs font-bold tracking-widest uppercase hover:border-black hover:bg-black hover:text-white transition-all duration-300 rounded-lg">
                Contact Us
            </Link>
        </div>
      </div>

    </div>
  );
}
