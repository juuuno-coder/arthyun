
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import ArchiveClient from "@/components/ArchiveClient";
import AdminPortfolioButtonClient from "@/components/AdminPortfolioButtonClient"; // Updated Import
import { extractFirstImage } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  
  // 1. Fetch new portfolios data from Firestore
  let portfolios: any[] = [];
  try {
      const q = query(
          collection(db, "portfolios"), 
          where("is_visible", "==", true)
      );
      
      const querySnapshot = await getDocs(q);
      portfolios = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
      console.error("Firebase fetch error:", e);
  }

  // 2. Transform to match ArchiveClient interface
  const formattedData = portfolios.map((item) => ({
    id: item.id,
    title: item.title,
    artist: item.artist || item.client || "ART HYUN",
    start_date: item.completion_date,
    end_date: null, 
    poster_url: item.thumbnail_url || extractFirstImage(item.description),
    description: item.description,
    source: "portfolio",
    category: item.category,
    created_at: item.created_at // Pass created_at for fallback sort
  }));

  // Sort manually
  // Logic: Use completion_date (start_date) if exists, otherwise created_at for sorting
  formattedData.sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
      const dateB = b.start_date ? new Date(b.start_date).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
      return dateB - dateA;
  });

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
          
          {/* Admin Button (Client Component) */}
          <div className="absolute top-0 right-0 p-6 md:p-0 md:relative md:top-auto md:right-auto">
             <AdminPortfolioButtonClient /> 
          </div>
        </div>

        {/* Client Component (Grid & Modal) */}
        {formattedData.length > 0 ? (
            <ArchiveClient initialData={formattedData} />
        ) : (
            <div className="py-20 text-center text-gray-400">
                <p>등록된 포트폴리오가 없습니다. (DB 연결 확인 필요)</p>
            </div>
        )}
        
      </div>
    </div>
  );
}
