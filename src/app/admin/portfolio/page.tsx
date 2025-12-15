import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import PortfolioListClient from "@/components/admin/PortfolioListClient";

export const dynamic = "force-dynamic";

export default async function AdminPortfolioList() {
    let portfolios: any[] = [];
    let errorMsg = "";

    try {
        const q = query(
            collection(db, "portfolios"),
            orderBy("created_at", "desc")
        );
        const querySnapshot = await getDocs(q);
        
        portfolios = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

    } catch (err: any) {
        console.error("Firestore Error:", err);
        errorMsg = err.message;
    }

    if (errorMsg) {
        return <div className="p-10 text-red-500">에러 발생: {errorMsg}</div>;
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

            <PortfolioListClient initialPortfolios={portfolios} />
        </div>
    );
}
