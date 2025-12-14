
import { supabase } from "@/lib/supabase";
import ArchiveClient from "@/components/ArchiveClient";
import { AdminExhibitionButton } from "@/components/AdminButtons";
import { extractFirstImage } from "@/lib/utils";

// 🚀 ISR 적용: 60초마다 캐시 갱신 (서버 부하 감소 & 속도 향상)
export const revalidate = 60;

export default async function ArchivePage() {
  // 1. 전시 데이터 가져오기 (DB)
  const { data: exhibitions } = await supabase
    .from("exhibitions")
    .select("*")
    .order("start_date", { ascending: false });

  // 2. 포트폴리오 + 첨부파일 데이터 가져오기 (마이그레이션된 데이터)
  const { data: migratedItems } = await supabase
    .from("migrated_posts")
    .select("*")
    .in("type", ["portfolio", "attachment"])
    .in("status", ["publish", "draft", "inherit"])
    .order("date", { ascending: false });

  // 3. 포맷 변환 및 이미지 추출
  const formattedItems = (migratedItems || []).map((p) => {
    // 이미지 추출 (포트폴리오: 본문 첫 이미지, 첨부파일: 본문 자체가 이미지 태그)
    let imageUrl = null;
    if (p.type === 'attachment') {
         // 첨부파일은 content에 <img src="...">가 있음.
         const match = p.content?.match(/src="([^"]+)"/);
         imageUrl = match ? match[1] : null;
         
         if (imageUrl) {
             // 1. /wp-content/uploads/ 경로 추출 (도메인 무관)
             const match = imageUrl.match(/\/wp-content\/uploads\/(.+)$/);
             if (match) {
                 const relativePath = match[1];
                 // 2. 경로의 각 부분(파일명 포함)을 인코딩하여 한글 깨짐 방지
                 // 단, 기존에 이미 인코딩된 경우(%)는 디코딩 후 다시 인코딩하거나 그대로 둠.
                 let encodedPath = relativePath;
                 try {
                     const decoded = decodeURIComponent(relativePath); 
                     encodedPath = decoded.split('/').map(p => encodeURIComponent(p)).join('/');
                 } catch (e) {
                     encodedPath = relativePath;
                 }

                 // 중요: Bucket 구조가 wp-content/uploads/YYYY/... 가 아니라 YYYY/... 로 되어 있음.
                 // 따라서 URL에서 migration_uploads 바로 뒤에 파일 경로를 붙임.
                 imageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + 
                    "/storage/v1/object/public/migration_uploads/" + encodedPath;
             }
         }
    } else {
        // 포트폴리오
        const imgMatch = p.content?.match(/<img[^>]+src="([^">]+)"/);
        imageUrl = imgMatch ? imgMatch[1] : null;
    }

    return {
      id: p.id,
      title: p.title || (p.type === 'attachment' ? 'Untitled Image' : 'Untitled'),
      artist: p.type === 'attachment' ? 'Media Resource' : (p.excerpt || ""),
      description: p.content,
      start_date: p.date ? new Date(p.date).toISOString().split('T')[0] : null,
      end_date: p.date ? new Date(p.date).toISOString().split('T')[0] : null,
      is_active: true,
      poster_url: imageUrl,
      source: p.type // 'portfolio' or 'attachment'
    };
  });

  // 4. 데이터 병합 (전시 + 마이그레이션 항목)
  const formattedExhibitions = (exhibitions || []).map((e: any) => ({
      ...e,
      poster_url: e.poster_url || extractFirstImage(e.description)
  }));

  const combinedData = [...formattedExhibitions, ...formattedItems].sort((a, b) => {
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
    return dateB - dateA; 
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-6 mt-8 py-12 md:py-20 relative">
      <div className="flex justify-between items-end mb-12 border-b border-black pb-4">
        <h2 className="font-serif text-2xl md:text-3xl">Exhibition Archive</h2>

        {/* 3. 관리자에게만 보이는 등록 버튼 (클라이언트 사이드 체크) */}
        <AdminExhibitionButton />
      </div>

      {/* 4. 기존 모달 스타일 유지 */}
      <ArchiveClient initialData={combinedData} />
    </div>
  );
}
