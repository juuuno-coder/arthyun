import { Suspense } from "react";
import { getDashboardStats } from "@/actions/statsActions";
import Link from "next/link";
import { Users, Image as ImageIcon, Newspaper, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-serif font-bold mb-2">Dashboard</h1>
        <p className="text-gray-500">아트현 관리자 현황판입니다.</p>
      </div>

      {/* 0. 시스템 상태 카드 (도메인 & 유지관리) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* 도메인 상태 */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-xl p-8 shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                       <h2 className="text-xl font-bold tracking-tight">arthyun.co.kr</h2>
                       <span className="px-2 py-1 bg-green-500/20 text-green-300 text-[10px] font-bold rounded border border-green-500/30">ACTIVE</span>
                  </div>
                  
                  <div className="flex items-end justify-between">
                      <div className="space-y-1 text-xs text-blue-100/70 font-mono">
                          <p>REG : 2025-12-13</p>
                          <p>EXP : 2026-12-13</p>
                      </div>
                      <div className="text-right">
                          <p className="text-blue-200 text-[10px] font-medium uppercase tracking-widest mb-1">D-DAY</p>
                          <div className="text-4xl font-bold font-mono">
                              {Math.ceil((new Date("2026-12-13T12:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                              <span className="text-sm font-normal text-blue-300 ml-1">일 남음</span>
                          </div>
                      </div>
                  </div>
              </div>
              {/* Deco */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          </div>

          {/* 유지관리 상태 */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-8 shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                       <h2 className="text-xl font-bold tracking-tight">유지관리 (Maintenance)</h2>
                       <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-[10px] font-bold rounded border border-yellow-500/30">SUBSCRIBED</span>
                  </div>
                  
                  <div className="flex items-end justify-between">
                      <div className="space-y-1 text-xs text-gray-300/70 font-mono">
                          <p className="font-bold text-white mb-1 text-sm">BASIC PLAN</p>
                          <p>START : 2025-12-13</p>
                          <p>END&nbsp;&nbsp;&nbsp;: 2026-12-13</p>
                      </div>
                      <div className="text-right">
                          <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest mb-1">REMAINING</p>
                          <div className="text-4xl font-bold font-mono text-yellow-500">
                              {Math.ceil((new Date("2026-12-13T12:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                              <span className="text-sm font-normal text-yellow-200/50 ml-1 text-gray-400">일 남음</span>
                          </div>
                      </div>
                  </div>
              </div>
               {/* Deco */}
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          </div>
      </div>

      {/* 1. 통계 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* 방문자 카드 (Expanded) */}
        <div className="bg-black text-white p-6 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
                 <p className="text-white/60 text-sm font-medium mb-1">오늘 방문자</p>
                 <h3 className="text-5xl font-bold mb-4">{stats.todayVisitorCount}</h3>
                 
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                    <div>
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">누적 방문자</p>
                        <p className="text-lg font-bold">{stats.totalVisitorCount.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">일평균</p>
                        <p className="text-lg font-bold">{stats.averageVisitorCount.toLocaleString()}</p>
                    </div>
                 </div>
            </div>
          </div>
          <Users className="absolute right-4 bottom-4 text-white/10 group-hover:scale-110 transition duration-500" size={80} />
        </div>

        {/* 포트폴리오 카드 (NEW) */}
        <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm hover:shadow-md transition relative overflow-hidden group">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">포트폴리오</p>
              <h3 className="text-4xl font-bold text-gray-900">{stats.portfolioCount}</h3>
            </div>
            <div className="flex gap-3 mt-4">
              <Link href="/admin/portfolio" className="text-xs bg-gray-900 text-white px-3 py-2 rounded hover:bg-black transition">
                관리
              </Link>
              <Link href="/admin/portfolio/write" className="text-xs border border-gray-300 px-3 py-2 rounded hover:border-black hover:bg-gray-50 transition">
                + 등록
              </Link>
            </div>
          </div>
          <ImageIcon className="absolute right-4 bottom-4 text-gray-100 group-hover:text-gray-200 transition duration-500" size={64} />
        </div>

        {/* 미디어 카드 */}
        <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm hover:shadow-md transition relative overflow-hidden group">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">언론보도</p>
              <h3 className="text-4xl font-bold text-gray-900">{stats.mediaCount}</h3>
            </div>
            <div className="flex gap-3 mt-4">
              <Link href="/admin/media" className="text-xs bg-gray-900 text-white px-3 py-2 rounded hover:bg-black transition">
                관리
              </Link>
              <Link href="/admin/media/write" className="text-xs border border-gray-300 px-3 py-2 rounded hover:border-black hover:bg-gray-50 transition">
                + 등록
              </Link>
            </div>
          </div>
          <Newspaper className="absolute right-4 bottom-4 text-gray-100 group-hover:text-gray-200 transition duration-500" size={64} />
        </div>
      </div>

      {/* 2. 방문자 차트 (CSS Simple Bar Chart) */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="flex justify-between items-center mb-0">
            <div>
                <h3 className="text-xl font-bold">방문자 추이</h3>
                <p className="text-sm text-gray-500">최근 30일간의 방문자 (세션 기준)</p>
            </div>
            <div className="text-sm text-gray-400 font-mono">
                LAST 30 DAYS
            </div>
        </div>
        
        {stats.visitorStats.length > 0 ? (
          <div className="flex items-end justify-between gap-1 md:gap-2 h-72 w-full overflow-x-auto overflow-y-hidden pb-4 pt-12">
            {stats.visitorStats.map((stat) => {
              // 최대값 기준으로 높이 퍼센트 계산
              const maxVal = Math.max(...stats.visitorStats.map((s) => s.count), 10);
              const heightPercent = Math.max((stat.count / maxVal) * 100, 5); 
              
              const dateObj = new Date(stat.date);
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

              return (
                <div key={stat.date} className="flex flex-col items-center justify-end flex-1 gap-2 group h-full min-w-[24px]">
                  <div 
                    className={`relative w-full max-w-[30px] rounded-t-sm transition-all duration-300 ${isWeekend ? 'bg-blue-900/80 hover:bg-blue-800' : 'bg-black/80 hover:bg-black'}`}
                    style={{ height: `${heightPercent}%` }}
                  >
                    {/* 툴팁 (호버시) -> 항상 표시되는 숫자로 변경할지? 일단 툴팁 위치 확보를 위해 pt-12 추가함 */}
                    {/* 숫자가 잘린다면 호버가 아닌 항상 표시 옵션도 고려. 여기서는 호버 유지하되 위치 보정. */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg pointer-events-none mb-1">
                      <span className="font-bold">{stat.count}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] md:text-[10px] rotate-0 truncate w-full text-center ${isWeekend ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                    {/* 날짜 포맷 MM.DD */}
                    {stat.date.substring(5).replace('-', '.')}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg mt-8">
             아직 집계된 방문자 데이터가 없습니다.
          </div>
        )}
      </div>

    </div>
  );
}
