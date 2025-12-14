"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// [방문자 수 증가] (누구나 호출 가능 - 내부적으로 처리)
export async function incrementVisitor() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // 1. 오늘 날짜 레코드 조회
  const { data: existing } = await supabase
    .from("daily_stats")
    .select("*")
    .eq("date", today)
    .single();

  if (existing) {
    // 2. 있으면 카운트 +1
    await supabase
      .from("daily_stats")
      .update({ count: existing.count + 1 })
      .eq("date", today);
  } else {
    // 3. 없으면 새로 생성 (count: 1)
    await supabase.from("daily_stats").insert({ date: today, count: 1 });
  }
}

// [대시보드 통계 조회] (관리자용)
export async function getDashboardStats() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
    }
  );

  // 1. 전체 전시 수 (제거 또는 유지, 일단 유지하되 사용 안 함)
  const { count: exhibitionCount } = await supabase
    .from("exhibitions")
    .select("*", { count: "exact", head: true });

  // 1.5 전체 포트폴리오 수 (NEW)
  const { count: portfolioCount } = await supabase
    .from("portfolios")
    .select("*", { count: "exact", head: true });

  // 2. 전체 미디어 수
  const { count: mediaCount } = await supabase
    .from("media_releases")
    .select("*", { count: "exact", head: true });

  // 3. 최근 7일 방문자 통계
  const { data: visitorStats } = await supabase
    .from("daily_stats")
    .select("*")
    .order("date", { ascending: true }) // 날짜순 정렬
    .limit(30); // 최대 30일

  // 4. 오늘의 방문자 수
  const today = new Date().toISOString().split("T")[0];
  const todayStat = visitorStats?.find((s) => s.date === today);

  // 5. 전체 누적 방문자 수 (All Time)
  const { data: allStats } = await supabase
    .from("daily_stats")
    .select("count");
  
  const totalVisitorCount = allStats?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
  
  // 6. 일평균 방문자 수 (데이터가 있는 날 기준)
  const averageVisitorCount = allStats && allStats.length > 0
    ? Math.round(totalVisitorCount / allStats.length)
    : 0;

  return {
    exhibitionCount: exhibitionCount || 0,
    portfolioCount: portfolioCount || 0,
    mediaCount: mediaCount || 0,
    todayVisitorCount: todayStat?.count || 0,
    totalVisitorCount,
    averageVisitorCount,
    visitorStats: visitorStats || [],
  };
}
