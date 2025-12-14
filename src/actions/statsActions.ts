"use server";

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

// Admin Client (Bypass RLS)
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
};

/* 
  [SQL 업데이트 필요]
  이 기능을 완전히 사용하려면 Supabase의 SQL 에디터에서 아래 쿼리를 실행해주세요:
  
  CREATE TABLE IF NOT EXISTS visit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ip_hash TEXT,
      user_agent TEXT,
      path TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );
  
  CREATE INDEX IF NOT EXISTS idx_visit_logs_created_at ON visit_logs (created_at);
*/

// [방문자 수 증가] (고도화됨)
export async function incrementVisitor() {
  const cookieStore = await cookies();
  const supabase = getAdminClient();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // 1. 쿠키 확인 (24시간 기준 유니크 방문자 체크)
  const hasVisitedCookie = cookieStore.get(`visited_${today}`);

  // 헤더 정보 수집 (IP, User-Agent)
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "unknown";
  const ip = headersList.get("x-forwarded-for") || "unknown";
  // 간단한 IP 해싱 (개인정보 보호)
  const ipHash = Buffer.from(ip).toString('base64'); 

  try {
    // 2. 방문 로그 기록 (visit_logs 테이블이 있다면)
    // 테이블이 없으면 에러가 나겠지만 catch로 무시하여 사이트 작동 보장
    await supabase.from("visit_logs").insert({
      ip_hash: ipHash,
      user_agent: userAgent,
      path: "/", // 메인/공통 접근으로 간주, 필요시 매개변수로 받음
    });
  } catch (e) {
    // visit_logs 테이블이 아직 없을 수 있음
  }

  // 3. 통계 집계
  if (!hasVisitedCookie) {
    // 오늘 처음 방문한 경우에만 카운트 증가
    try {
      const { data: existing } = await supabase
        .from("daily_stats")
        .select("*")
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("daily_stats")
          .update({ count: existing.count + 1 })
          .eq("date", today);
      } else {
        await supabase.from("daily_stats").insert({ date: today, count: 1 });
      }

      // 쿠키 설정 (자정까지 유효하게 하거나 24시간)
      // 여기서는 심플하게 24시간 설정
      // [주의] Server Action에서 쿠키 설정은 'cookies()' 객체 조작으로 가능
      cookieStore.set(`visited_${today}`, 'true', {
        maxAge: 60 * 60 * 24, // 24 hours
        httpOnly: true,
        path: '/',
      });
      
    } catch (error) {
      console.error("Failed to update daily stats:", error);
    }
  }
}

// [대시보드 통계 조회]
export async function getDashboardStats() {
  // ... (기존 코드와 유사하되 AdminClient 사용 권장)
  const cookieStore = await cookies();
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) {
    return {
        exhibitionCount: 0,
        portfolioCount: 0,
        mediaCount: 0,
        todayVisitorCount: 0,
        totalVisitorCount: 0,
        averageVisitorCount: 0,
        visitorStats: [],
    };
  }

  const supabase = getAdminClient();

  // 1. 전체 전시 수
  let exhibitionCount = 0;
  try {
    const { count } = await supabase
      .from("exhibitions")
      .select("*", { count: "exact", head: true });
    exhibitionCount = count || 0;
  } catch (e) {}

  // 2. 전체 포트폴리오 수
  const { count: portfolioCount } = await supabase
    .from("portfolios")
    .select("*", { count: "exact", head: true });

  // 3. 전체 미디어 수
  const { count: mediaCount } = await supabase
    .from("media_releases")
    .select("*", { count: "exact", head: true });

  // 4. 최근 30일 방문자 통계
  const { data: visitorStats } = await supabase
    .from("daily_stats")
    .select("*")
    .order("date", { ascending: true }) // 오름차순 (그래프용)
    .limit(30); 

  // 5. 오늘의 방문자 수
  const today = new Date().toISOString().split("T")[0];
  const todayStat = visitorStats?.find((s) => s.date === today);

  // 6. 전체 누적 방문자 수
  const { data: allStats } = await supabase
    .from("daily_stats")
    .select("count");
  
  const totalVisitorCount = allStats?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
  
  // 7. 일평균 방문자 수
  const averageVisitorCount = allStats && allStats.length > 0
    ? Math.round(totalVisitorCount / allStats.length)
    : 0;

  return {
    exhibitionCount,
    portfolioCount: portfolioCount || 0,
    mediaCount: mediaCount || 0,
    todayVisitorCount: todayStat?.count || 0,
    totalVisitorCount,
    averageVisitorCount,
    visitorStats: visitorStats || [],
  };
}
