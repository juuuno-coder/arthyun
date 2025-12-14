import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteMediaButton from "@/components/admin/DeleteMediaButton";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, Edit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMediaList() {
  const { data: mediaList, error } = await supabase
    .from("media_releases")
    .select("*")
    .order("published_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-10 text-red-500">에러 발생: {error.message}</div>;
  }

  return (
    <div className="max-w-screen-xl mx-auto py-20 px-6">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-serif font-bold">언론보도 관리</h1>
        <Link href="/admin/media/write">
          <Button className="bg-black text-white hover:bg-gray-800">
            + 새 보도자료 등록
          </Button>
        </Link>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">언론사</th>
              <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">제목</th>
              <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase">등록일</th>
              <th className="p-4 text-center text-xs font-bold text-gray-500 uppercase">상세보기</th>
              <th className="p-4 text-center text-xs font-bold text-gray-500 uppercase">원문링크</th>
              <th className="p-4 text-center text-xs font-bold text-gray-500 uppercase">수정</th>
              <th className="p-4 text-center text-xs font-bold text-gray-500 uppercase">삭제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mediaList?.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-400">
                  등록된 보도자료가 없습니다.
                </td>
              </tr>
            ) : (
              mediaList?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-sm font-bold text-blue-600">
                    {item.press_name}
                  </td>
                  <td className="p-4 text-gray-900 font-medium">
                    {item.title}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {item.published_date
                      ? new Date(item.published_date).toLocaleDateString('ko-KR')
                      : new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      href={`/media/${item.id}`}
                      className="inline-flex items-center justify-center text-gray-400 hover:text-green-600"
                      title="상세보기"
                    >
                      <Eye size={18} />
                    </Link>
                  </td>
                  <td className="p-4 text-center">
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center text-gray-400 hover:text-blue-600"
                      title="원문 링크"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      href={`/admin/media/edit/${item.id}`}
                      className="inline-flex items-center justify-center text-gray-400 hover:text-orange-600"
                      title="수정"
                    >
                      <Edit size={18} />
                    </Link>
                  </td>
                  <td className="p-4 text-center">
                    <DeleteMediaButton id={item.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
