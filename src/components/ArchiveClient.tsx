"use client";

import { useState, useEffect } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { X, Search } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { importPortfolio } from "@/actions/migrationActions";
import { stripImageFromContent } from "@/lib/utils";
import ImageFixDialog from "@/components/admin/ImageFixDialog";

type SortType = "date" | "name";

// Date parsing helper
function parseDate(val: any): number {
    if (!val) return 0;
    if (val instanceof Date) return val.getTime();
    if (typeof val === 'number') return val;
    
    try {
        let str = String(val).trim();
        // Remove "년", "월", "일" and Spaces
        str = str.replace(/년|월|일/g, ".").replace(/\s+/g, "");
        // Handle YYYY.MM.DD
        if (str.includes('.')) {
            const parts = str.split('.').filter(Boolean);
            if (parts.length > 0) {
                 str = parts.join('-');
            }
        }
        
        const d = new Date(str);
        if (!isNaN(d.getTime())) return d.getTime();
        
        // Final attempt for ISO string fallback
        const d2 = new Date(val);
        if (!isNaN(d2.getTime())) return d2.getTime();
    } catch(e) {}
    return 0;
}

export default function ArchiveClient({ initialData }: { initialData: any[] }) {
  const router = useRouter();
  // 모달 상태 관리
  const [selectedExhibition, setSelectedExhibition] = useState<any>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsAdmin(true);
    });
  }, []);

  const handleImport = async () => {
      if (!selectedExhibition || !isAdmin) return;
      if (!confirm("이 항목을 포트폴리오로 복사하시겠습니까?\n이미지 파일도 함께 복사되며, 원본은 유지됩니다.")) return;

      setIsImporting(true);
      try {
          await importPortfolio(selectedExhibition.id);
          toast.success("포트폴리오로 복사되었습니다. (관리자 페이지에서 확인)");
          // setSelectedExhibition(null); // Keep open if user wants to see it? Or close.
          // router.refresh(); // Refresh list not needed if we don't delete. But good to sync.
      } catch (e: any) {
          toast.error("복사 실패: " + e.message);
      } finally {
          setIsImporting(false);
      }
  };
  
  // 필터 및 정렬 상태
  const [sortType, setSortType] = useState<SortType>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // Default desc for date
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(initialData);

  // 데이터 필터링 및 정렬 통합 로직
  useEffect(() => {
    let result = [...initialData];

    // 1. 검색어 필터링
    if (searchTerm.trim() !== "") {
      const lowerQuery = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.title?.toLowerCase().includes(lowerQuery) || 
        item.artist?.toLowerCase().includes(lowerQuery) ||
        item.subtitle?.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. 카테고리 필터링
    if (categoryFilter !== "ALL") {
      result = result.filter(item => item.category === categoryFilter);
    }

    // 3. 정렬
    result.sort((a, b) => {
      let comparison = 0;
      if (sortType === "date") {
        const timeA = parseDate(a.start_date) || parseDate(a.created_at);
        const timeB = parseDate(b.start_date) || parseDate(b.created_at);
        comparison = timeA - timeB;
      } else {
        comparison = (a.title || "").localeCompare(b.title || "", 'ko-KR');
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredData(result);
  }, [sortType, sortOrder, categoryFilter, searchTerm, initialData]);

  // Sort Handler
  const handleSortClick = (type: SortType) => {
      if (sortType === type) {
          setSortOrder(prev => prev === "asc" ? "desc" : "asc");
      } else {
          setSortType(type);
          setSortOrder(type === "date" ? "desc" : "asc"); // Date default desc, Name default asc
      }
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // 1. 라이트박스가 열려있으면 라이트박스만 닫음
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
          // 라이트박스는 이벤트 버블링이나 라이브러리 자체 처리가 있을 수 있으므로
          // 여기서 return하여 모달 닫기 로직이 실행되지 않도록 함
          return;
        }

        // 2. 라이트박스가 닫혀있고, 모달이 열려있으면 모달 닫음
        if (selectedExhibition) {
          setSelectedExhibition(null);
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedExhibition, isLightboxOpen]);

  return (
    <>
      {/* Search & Sort Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 pb-4 border-b border-gray-100">
        
        {/* Search Bar */}
        {/* Search Bar Removed */ }
        <div className="hidden"></div>

        <div className="flex flex-wrap gap-2 self-start md:self-auto">
            {[
                "ALL", 
                "Culture", // 문화예술
                "Painting", // 페인팅
                "PublicArtDesign", // 공공미술/디자인
                "Exhibition", // 전시/박람회
                "Space", // 공간조성
                "Sculpture", // 조형물
                "Festival", // 축제/이벤트
                "Education", // 체험/교육
                "Other" // 기타
            ].map((cat) => (
                <Button
                    key={cat}
                    onClick={() => setCategoryFilter(cat === "ALL" ? "ALL" : cat)}
                    variant="ghost"
                    size="sm"
                    className={`text-sm tracking-widest px-3 py-1 ${categoryFilter === (cat === "ALL" ? "ALL" : cat) ? "font-bold text-black border-b-2 border-black rounded-none h-auto px-0 pb-1" : "text-gray-400 font-normal hover:text-gray-800"}`}
                >
                    {cat === "Culture" ? "문화예술" : 
                     cat === "Painting" ? "페인팅" : 
                     cat === "PublicArtDesign" ? "공공미술/디자인" :  
                     cat === "Exhibition" ? "전시/박람회" : 
                     cat === "Space" ? "공간조성" : 
                     cat === "Sculpture" ? "조형물" : 
                     cat === "Festival" ? "축제/이벤트" : 
                     cat === "Education" ? "체험/교육" : 
                     cat === "Other" ? "기타" : "ALL"}
                </Button>
            ))}
        </div>
        
        {/* Sort Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto ml-auto">
            { /* <span className="text-xs text-gray-400 mr-2">정렬:</span> */ }
            <button 
                onClick={() => handleSortClick("date")}
                className={`text-xs px-2 py-1 transition-colors flex items-center gap-1 ${sortType === "date" ? "font-bold text-black border-b border-black" : "text-gray-400 hover:text-black"}`}
            >
                최신순 {sortType === "date" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button 
                onClick={() => handleSortClick("name")}
                className={`text-xs px-2 py-1 transition-colors flex items-center gap-1 ${sortType === "name" ? "font-bold text-black border-b border-black" : "text-gray-400 hover:text-black"}`}
            >
                가나다순 {sortType === "name" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
        </div>

      </div>

      {/* 1. Exhibition Grid */}
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16 animate-fade-in">
            {filteredData.map((item) => (
            <div
                key={item.id}
                className="group cursor-pointer"
                onClick={() => setSelectedExhibition(item)}
            >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 mb-5 shadow-sm border border-gray-100/50">
                {/* Poster Image (Lazy Loaded) */}
                {item.poster_url ? (
                    <img
                    loading="lazy"
                    src={item.poster_url}
                    alt={item.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-700 ease-out"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                        <div className="w-8 h-8 border border-gray-200 rounded-full"></div>
                        <span className="text-[10px] tracking-widest">NO IMAGE</span>
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-white border border-white/80 bg-black/20 px-6 py-2 text-xs tracking-[0.2em] font-light backdrop-blur-md">
                    VIEW
                    </span>
                </div>
                </div>

                <div className="space-y-1">
                    <p className="text-xs font-bold text-blue-600 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0 duration-300 block h-4">
                        {item.source === 'portfolio' ? 'ARCHIVE' : 'EXHIBITION'}
                    </p>
                    <h3 className="text-lg font-serif font-bold text-gray-900 group-hover:text-black transition leading-tight">
                        {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                        {item.artist || item.subtitle}
                    </p>
                </div>
            </div>
            ))}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400">
            <p className="text-lg mb-2">검색 결과가 없습니다.</p>
            <p className="text-sm cursor-pointer hover:text-black underline" onClick={() => setSearchTerm("")}>전체 목록 보기</p>
        </div>
      )}

      {/* 2. Modal Detail View */}
      {selectedExhibition && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 animate-fade-in" style={{zIndex: 9999}}>
          <div
            className="absolute inset-0"
            onClick={() => setSelectedExhibition(null)}
          />

          <div className="bg-white w-full h-full md:w-[95vw] md:h-[90vh] md:max-w-[1600px] md:rounded-xl relative shadow-2xl flex flex-col md:overflow-hidden overflow-y-auto">
            
            <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
              <div className="flex items-center gap-2">
                {/* Admin Tools Hidden by Request */}
                {/* {isAdmin && (
                    <>
                      {selectedExhibition.source === 'portfolio' && (
                          <Button 
                            onClick={handleImport} 
                            disabled={isImporting}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                          >
                            {isImporting ? "복사..." : "포트폴리오 복사"}
                          </Button>
                      )}
                      <ImageFixDialog 
                        postId={selectedExhibition.id} 
                        content={selectedExhibition.description || ""} 
                        onUpdate={(newContent) => setSelectedExhibition((prev: any) => prev ? ({...prev, description: newContent}) : null)}
                      />
                    </>
                )} */}
              </div>
              <button
                onClick={() => setSelectedExhibition(null)}
                className="p-2 text-gray-400 hover:text-black bg-white/50 hover:bg-white rounded-full transition"
              >
                <X size={28} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 h-full">
              {/* Left: Image (Fit Contain) */}
              <div className="w-full md:w-[16%] bg-[#F8F8F8] p-4 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 shrink-0">
                {selectedExhibition.poster_url ? (
                  <div 
                    className="cursor-zoom-in w-full h-full flex items-center justify-center relative"
                    onClick={() => setIsLightboxOpen(true)}
                  >
                     <img
                      src={selectedExhibition.poster_url}
                      alt={selectedExhibition.title}
                      className="w-full h-auto max-h-[70vh] object-contain shadow-lg"
                    />
                  </div>
                ) : (
                    <div className="text-gray-300 tracking-widest text-xs">NO IMAGE AVAILABLE</div>
                )}
              </div>

              {/* Right: Info */}
              <div className="w-full md:w-[84%] p-8 md:p-16 space-y-10 bg-white md:overflow-y-auto h-full custom-scrollbar">
                
                {/* Header Info */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                      <span className="px-2 py-1 bg-black text-white text-[10px] font-bold tracking-widest uppercase">
                        {selectedExhibition.source === 'portfolio' ? 'ARCHIVE' : 'EXHIBITION'}
                      </span>
                      {selectedExhibition.start_date && (
                        <span className="text-xs text-gray-400 tracking-wider">
                            {selectedExhibition.start_date.substring(0, 4)}
                        </span>
                      )}
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 leading-tight">
                    {selectedExhibition.title}
                  </h2>
                  <p className="text-xl text-gray-500 font-serif italic border-l-2 border-black pl-4">
                    {selectedExhibition.artist || selectedExhibition.subtitle}
                  </p>
                </div>

                {/* Meta Data */}
                <div className="grid grid-cols-2 gap-6 text-xs tracking-widest text-gray-500 border-y border-gray-100 py-6">
                    <div>
                        <span className="block text-gray-800 font-bold mb-1">DATE</span>
                        {selectedExhibition.start_date} ~ {selectedExhibition.end_date}
                    </div>
                </div>

                {/* Description Content */}
                <div
                  className="text-sm text-gray-600 leading-8 text-justify min-h-[100px] prose prose-sm max-w-none prose-p:mb-4 prose-img:rounded-none prose-img:mt-8 prose-img:mb-8"
                  dangerouslySetInnerHTML={{
                    __html: stripImageFromContent(selectedExhibition.description, selectedExhibition.poster_url) || "<p class='text-gray-400 italic'>상세 설명이 없습니다.</p>",
                  }}
                />
              </div>
            </div>
          </div>


        
        {/* Lightbox Component */}
        <Lightbox
            open={isLightboxOpen}
            close={() => setIsLightboxOpen(false)}
            slides={[{ src: selectedExhibition.poster_url }]}
            styles={{ container: { backgroundColor: "rgba(0, 0, 0, .9)", zIndex: 10000 } }}
            render={{
             buttonPrev: () => null,
             buttonNext: () => null,
            }}
        />
      </div>
     )}
    </>
  );
}
