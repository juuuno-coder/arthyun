"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STORAGE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL +
  "/storage/v1/object/public/migration_uploads";

export default function MediaLibraryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 24;

  useEffect(() => {
    fetchItems(1);
  }, []);

  const fetchItems = async (page: number) => {
    setLoading(true);
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("migrated_posts")
      .select("*", { count: "exact" })
      .eq("type", "attachment")
      .order("date", { ascending: false })
      .range(start, end);

    if (error) {
      toast.error("이미지를 불러오는데 실패했습니다.");
      console.error(error);
    } else {
      if (page === 1) setItems(data || []);
      else setItems((prev) => [...prev, ...(data || [])]);

      setHasMore(count ? start + PAGE_SIZE < count : false);
      setPage(page);
    }
    setLoading(false);
  };

  const getImageUrl = (htmlContent: string) => {
    // Extract src from <img src="...">
    const match = htmlContent.match(/src="([^"]+)"/);
    if (match) {
      let url = match[1];
      
      // Robust fix for migrated images
      // If URL contains /wp-content/uploads/, we assume the file exists in 'migration_uploads' bucket
      // respecting the structure AFTER 'uploads/'.
      const pathMatch = url.match(/\/wp-content\/uploads\/(.+)$/);
      if (pathMatch) {
          const relativePath = pathMatch[1];
          // Encode components to handle Korean characters
          let encodedPath = relativePath;
          try {
             // Decode first in case it's double encoded or mixed
             const decoded = decodeURIComponent(relativePath);
             encodedPath = decoded.split('/').map(p => encodeURIComponent(p)).join('/');
          } catch (e) {
             encodedPath = relativePath;
          }
          
          // Construct new URL: STORAGE_URL (points to migration_uploads root) + / + relative path
          return `${STORAGE_URL}/${encodedPath}`;
      }
      return url;
    }
    return null;
  };

  return (
    <div className="max-w-screen-2xl mx-auto py-20 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold mb-2">미디어 라이브러리</h1>
        <p className="text-gray-500">
          복구된 과거 워드프레스 첨부파일(이미지) 목록입니다.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {items.map((item) => {
          const imageUrl = getImageUrl(item.content);
          return (
            <div
              key={item.id}
              className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                         (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Image+Broken';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                    No Image
                  </div>
                )}
                
                {/* Overlay with details */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-white text-center">
                    <p className="text-xs mb-2 line-clamp-2">{item.title}</p>
                    <p className="text-[10px] text-gray-300 mb-4">{new Date(item.date).toLocaleDateString()}</p>
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-7 text-xs"
                        onClick={() => {
                            if(imageUrl) {
                                navigator.clipboard.writeText(imageUrl);
                                toast.success("이미지 주소가 복사되었습니다.");
                            }
                        }}
                    >
                        주소 복사
                    </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
        </div>
      )}

      {!loading && hasMore && (
        <div className="text-center py-10">
          <Button
            onClick={() => fetchItems(page + 1)}
            variant="outline"
            className="w-full md:w-auto"
          >
            더 보기
          </Button>
        </div>
      )}

      {!loading && items.length === 0 && (
            <div className="py-20 text-center text-gray-400">
                복구된 미디어 파일이 없습니다.
            </div>
      )}
    </div>
  );
}
