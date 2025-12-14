"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DeletePortfolioButton from "@/components/admin/DeletePortfolioButton";
import { ArrowUpDown } from "lucide-react";

type Portfolio = {
    id: number;
    title: string;
    client?: string;
    location?: string;
    category?: string;
    thumbnail_url?: string;
    completion_date?: string;
    is_visible: boolean;
    created_at: string;
};

const CATEGORY_MAP: Record<string, string> = {
    "Culture": "문화예술",
    "Painting": "페인팅",
    "PublicArtDesign": "공공미술/디자인",
    "Exhibition": "전시/박람회",
    "Space": "공간조성",
    "Sculpture": "조형물",
    "Festival": "축제/이벤트",
    "Education": "체험/교육",
    "Other": "기타"
};

export default function PortfolioListClient({ initialPortfolios }: { initialPortfolios: Portfolio[] }) {
    const [portfolios, setPortfolios] = useState<Portfolio[]>(initialPortfolios);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Portfolio; direction: 'asc' | 'desc' } | null>(null);

    const handleSort = (key: keyof Portfolio) => {
        let direction: 'asc' | 'desc' = 'asc';
        
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        
        setSortConfig({ key, direction });

        const sorted = [...portfolios].sort((a, b) => {
            const aValue = a[key] ?? "";
            const bValue = b[key] ?? "";

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setPortfolios(sorted);
    };

    return (
        <>
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                            <th 
                                className="p-4 border-b cursor-pointer hover:bg-gray-100 transition select-none"
                                onClick={() => handleSort('category')}
                            >
                                <div className="flex items-center gap-1">
                                    카테고리
                                    <ArrowUpDown size={14} className="text-gray-400" />
                                </div>
                            </th>
                            <th className="p-4 border-b">이미지</th>
                            <th 
                                className="p-4 border-b cursor-pointer hover:bg-gray-100 transition select-none"
                                onClick={() => handleSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    프로젝트명
                                    <ArrowUpDown size={14} className="text-gray-400" />
                                </div>
                            </th>
                            <th 
                                className="p-4 border-b cursor-pointer hover:bg-gray-100 transition select-none"
                                onClick={() => handleSort('is_visible')}
                            >
                                <div className="flex items-center gap-1">
                                    활성화
                                    <ArrowUpDown size={14} className="text-gray-400" />
                                </div>
                            </th>
                            <th className="p-4 border-b text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {portfolios.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-10 text-center text-gray-400">
                                    등록된 포트폴리오가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            portfolios.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                    {/* 1. 카테고리 (Category) - Moved to Front */}
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium whitespace-nowrap">
                                            {CATEGORY_MAP[item.category || ""] || item.category || "General"}
                                        </span>
                                    </td>

                                    {/* 2. 이미지 (Image) */}
                                    <td className="p-4 w-24">
                                        <div className="relative w-16 h-12 bg-gray-100 rounded overflow-hidden">
                                            {item.thumbnail_url ? (
                                                <img
                                                    src={item.thumbnail_url}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-xs text-gray-400">
                                                    No Img
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* 3. 프로젝트명 (Title) */}
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900">{item.title}</p>
                                    </td>

                                    {/* 4. 활성화 (Active) */}
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${item.is_visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                                            {item.is_visible ? "Active" : "Hidden"}
                                        </span>
                                    </td>

                                    {/* 5. 관리 (Manage) */}
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/admin/portfolio/edit/${item.id}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-gray-600 border-gray-300 hover:text-black"
                                                >
                                                    수정
                                                </Button>
                                            </Link>
                                            <DeletePortfolioButton id={item.id} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
