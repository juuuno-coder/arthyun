import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import PortfolioListClient from "@/components/admin/PortfolioListClient";

export const dynamic = "force-dynamic";

export default async function AdminPortfolioList() {
    const { data: portfolios, error } = await supabase
        .from("portfolios")
        .select("*")
        .order("created_at", { ascending: false }); // Default sort by created_at

    if (error) {
        return <div className="p-10 text-red-500">에러 발생: {error.message} (테이블이 생성되었는지 확인해주세요)</div>;
    }

    return (
        <div className="max-w-screen-xl mx-auto py-20 px-6">
            <div className="flex items-center justify-between mb-10">
                <h1 className="text-3xl font-serif font-bold">포트폴리오 관리</h1>
                <Link href="/admin/portfolio/write">
                    <Button className="bg-black text-white hover:bg-gray-800">
                        + 새 포트폴리오 등록
                    </Button>
                </Link>
            </div>

            <PortfolioListClient initialPortfolios={portfolios || []} />
        </div>
    );
}
