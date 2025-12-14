import { supabase } from "@/lib/supabase";
import ArchiveClient from "@/components/ArchiveClient";
import { AdminPortfolioButton } from "@/components/AdminButtons";
import { extractFirstImage } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  // 1. Fetch new portfolios data
  const { data: portfolios, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("is_visible", true)
    .order("completion_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Portfolio fetch error:", error);
    // 테이블이 없을 수도 있으니 에러 시 빈 배열 처리 (또는 에러 UI)
  }

  // 2. Transform to match ArchiveClient interface
  const formattedData = (portfolios || []).map((item) => ({
    id: item.id,
    title: item.title,
    artist: item.artist || item.client || "ART HYUN",
    start_date: item.completion_date,
    end_date: null, // 포트폴리오는 보통 완료일만 있음
    poster_url: item.thumbnail_url || extractFirstImage(item.description),
    description: item.description,
    source: "portfolio",
    category: item.category // 추가 필드
  }));

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="max-w-screen-2xl mx-auto px-6">
        
        {/* Header */}
        <div className="mb-16 border-b border-black pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] text-blue-600 block mb-2">
               ART HYUN ARCHIVE
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter uppercase mb-4">
              Portfolio
            </h1>
            <p className="max-w-xl text-gray-500 font-light leading-relaxed">
              아트현이 진행한 다양한 공공미술, 디자인, 벽화 프로젝트를 소개합니다.
              <br className="hidden md:block"/>
              예술을 통해 도시와 공간에 새로운 가치를 더합니다.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs font-mono text-gray-400">
              TOTAL PROJECTS
            </p>
            <p className="text-4xl font-bold font-serif">
              {formattedData.length}
            </p>
          </div>
          
          {/* Admin Button (Mobile/Desktop) */}
          <div className="absolute top-0 right-0 p-6 md:p-0 md:relative md:top-auto md:right-auto">
             <AdminPortfolioButton /> 
          </div>
        </div>

        {/* Client Component (Grid & Modal) */}
        {formattedData.length > 0 ? (
            <ArchiveClient initialData={formattedData} />
        ) : (
            <div className="py-20 text-center text-gray-400">
                <p>등록된 포트폴리오가 없습니다. (DB 마이그레이션이 필요합니다)</p>
            </div>
        )}
        
      </div>
    </div>
  );
}
