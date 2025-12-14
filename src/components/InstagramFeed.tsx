import { Instagram } from "lucide-react";
import Image from "next/image";

export default function InstagramFeed() {
  // 실제로는 인스타그램 이미지를 보여줘야 함. 여기선 더미.
  const dummyImages = [
    "https://images.unsplash.com/photo-1515405295579-ba7f9f1b8cd8?q=80&w=400",
    "https://images.unsplash.com/photo-1545989253-02cc26577f88?q=80&w=400",
    "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=400",
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400",
  ];

  return (
    <div className="bg-gray-50 p-8 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px] rounded-full">
            <div className="bg-white p-[2px] rounded-full">
              {/* 프로필 이미지 (로고 등) */}
              <div className="w-10 h-10 bg-black rounded-full" />
            </div>
          </div>
          <div>
            <p className="font-bold text-sm">artwaygallery_story</p>
            <p className="text-xs text-gray-500">아트웨이 갤러리</p>
          </div>
        </div>
        <a
          href="https://www.instagram.com/artwaygallery_story/"
          target="_blank"
          className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-md transition"
        >
          팔로우
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {dummyImages.map((src, i) => (
          <a
            key={i}
            href="https://www.instagram.com/artwaygallery_story/"
            target="_blank"
            className="relative aspect-square bg-gray-200 group overflow-hidden"
          >
            <Image
              src={src}
              alt="insta"
              fill
              className="object-cover group-hover:scale-110 transition duration-500"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
              <Instagram size={24} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
