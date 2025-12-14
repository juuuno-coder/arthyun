
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import SocialConnect from "@/components/SocialConnect";
import { AdminMediaButton } from "@/components/AdminButtons";

// 🚀 ISR 적용: 60초마다 캐시 갱신
export const revalidate = 60;

export default async function MediaPage() {
  // 1. Fetch Existing Media Releases (New System)
  const { data: pressReleases } = await supabase
    .from("media_releases")
    .select("*")
    .order("created_at", { ascending: false });

  // 2. Fetch Migrated Posts (Old System)
  // 2. Fetch Migrated Posts (Old System) -> REMOVED
  // 사용자 요청: 이전 DB 데이터(쓸데없는 글들)는 숨기기
  const oldItems: any[] = []; 
  
  /* 
  const { data: migratedPosts } = await supabase
    .from("migrated_posts")
    .select("*")
    .eq("type", "post")
    .neq("title", "Hello world!") // Exclude default
    .order("date", { ascending: false });
  */

  // Merge items
  const newItems = (pressReleases || []).map(item => ({
    id: `new-${item.id}`,
    realId: item.id,
    type: 'new',
    title: item.title,
    date: item.published_date || item.created_at,
    image: item.image_url,
    source: item.press_name || "NEWS",
    link: item.link_url || `/media/${item.id}` // Internal link if no external
  }));
                   
  // const oldItems = ... removed ...

  const items = [...newItems, ...oldItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-screen-2xl mx-auto px-6 mt-8 py-12 md:py-20 space-y-24">
      
      {/* 섹션 1: Press Release */}
      <section>
        <div className="mb-12 border-b border-black pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] text-blue-600 block mb-2">
               ART HYUN ARCHIVE
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter uppercase mb-4">
              Media
            </h1>
            <p className="max-w-xl text-gray-500 font-light leading-relaxed">
              아트현의 활동 소식과 언론 보도 자료를 확인하실 수 있습니다.
            </p>
          </div>
          
          <div className="mb-2 md:mb-0">
            <AdminMediaButton />
          </div>
        </div>

        <ul className="space-y-0">
          {items.length > 0 ? (
            items.map((item) => (
              <li key={item.id} className="group border-b border-gray-100 py-6 transition-colors">
                <Link href={item.link} className="flex flex-col md:flex-row gap-6 group">
                  {/* 1. 썸네일 이미지 (왼쪽) */}
                  {item.image ? (
                    <div className="w-full md:w-48 aspect-video shrink-0 overflow-hidden rounded-md bg-gray-100">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="hidden md:flex w-48 aspect-video bg-gray-50 items-center justify-center text-gray-300 text-xs shrink-0">
                        NO IMAGE
                    </div>
                  )}

                  {/* 2. 텍스트 정보 (오른쪽) */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-[#E85C4A] font-bold tracking-widest uppercase">
                          {item.source}
                        </span>
                        {/* 날짜 표시 */}
                        <div className="flex items-center gap-1 text-gray-400 text-sm shrink-0 font-heading">
                          <span>
                            {new Date(item.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg md:text-xl font-medium leading-snug group-hover:text-[#E85C4A] transition-colors mb-3">
                        {item.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-400 mt-2 font-heading tracking-wider">
                      <ExternalLink size={12} className="mr-1" /> READ MORE
                    </div>
                  </div>
                </Link>
              </li>
            ))
          ) : (
            <li className="py-10 text-center text-gray-400">등록된 보도자료가 없습니다.</li>
          )}
        </ul>
      </section>

      {/* 섹션 2: Social Connect */}
      <section>
        <h2 className="text-3xl font-heading font-bold uppercase tracking-widest mb-10 border-b border-black pb-4">
          Connect
        </h2>
        
        <div className="py-8">
          <SocialConnect />
        </div>
      </section>

    </div>
  );
}