import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DeleteExhibitionButton from "@/components/admin/DeleteExhibitionButton";
import { Button } from "@/components/ui/button";

// 캐싱 방지 (항상 최신 목록)
export const dynamic = "force-dynamic";

export default async function AdminExhibitionList() {
    const { data: exhibitions, error } = await supabase
        .from("exhibitions")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return <div className="p-10 text-red-500">에러 발생: {error.message}</div>;
    }

    return (
        <div className="max-w-screen-xl mx-auto py-20 px-6">
            <div className="flex items-center justify-between mb-10">
                <h1 className="text-3xl font-serif font-bold">전시 관리</h1>
                <Link href="/admin/exhibition/write">
                    <Button className="bg-black text-white hover:bg-gray-800">
                        + 새 전시 등록
                    </Button>
                </Link>
            </div>

            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 border-b">포스터</th>
                            <th className="p-4 border-b">제목 / 작가</th>
                            <th className="p-4 border-b">기간</th>
                            <th className="p-4 border-b">상태</th>
                            <th className="p-4 border-b text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {exhibitions?.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-10 text-center text-gray-400">
                                    등록된 전시가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            exhibitions?.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 w-24">
                                        <div className="relative w-16 h-20 bg-gray-100 rounded overflow-hidden">
                                            {item.poster_url ? (
                                                <img
                                                    src={item.poster_url}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-xs text-gray-400">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900">{item.title}</p>
                                        <p className="text-sm text-gray-500">{item.artist}</p>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {item.start_date} ~ {item.end_date}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            {item.is_active ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                                                    Inactive
                                                </span>
                                            )}
                                            {item.is_main_slider && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                    Main Slider
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/exhibition/edit/${item.id}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-gray-600 border-gray-300 hover:text-black"
                                                >
                                                    수정
                                                </Button>
                                            </Link>
                                            <DeleteExhibitionButton id={item.id} />
                                        </div>
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
