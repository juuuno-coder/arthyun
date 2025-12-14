
import { supabase } from "@/lib/supabase";
import InquiryListClient from "@/components/admin/InquiryListClient";

// 캐싱 방지 (실시간 확인 필요)
export const dynamic = "force-dynamic";

export default async function AdminInquiryPage() {
  const { data: inquiries, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">데이터 로드 실패: {error.message}</div>;
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">Inquiry Management</h1>
          <p className="text-gray-500">접수된 전시 신청 및 일반 문의 내역을 관리합니다.</p>
        </div>
      </div>

      <InquiryListClient initialInquiries={inquiries || []} />
    </div>
  );
}
