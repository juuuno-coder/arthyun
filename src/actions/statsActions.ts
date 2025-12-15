"use server";

import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  increment, 
  getDoc, 
  addDoc, 
  getCountFromServer,
  query, 
  orderBy, 
  limit, 
  getDocs
} from "firebase/firestore";
import { cookies, headers } from "next/headers";

// [방문자 수 증가] (고도화됨)
export async function incrementVisitor() {
  const cookieStore = await cookies();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // 1. 쿠키 확인 (24시간 기준 유니크 방문자 체크)
  const hasVisitedCookie = cookieStore.get(`visited_${today}`);

  // 헤더 정보 수집 (IP, User-Agent)
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "unknown";
  const ip = headersList.get("x-forwarded-for") || "unknown";
  // 간단한 IP 해싱
  const ipHash = Buffer.from(ip).toString('base64'); 

  try {
    // 2. 방문 로그 기록 (Fire and Forget)
    await addDoc(collection(db, "visit_logs"), {
      ip_hash: ipHash,
      user_agent: userAgent,
      path: "/", 
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.error("Visit log error", e);
  }

  // 3. 통계 집계
  if (!hasVisitedCookie) {
    // 오늘 처음 방문한 경우에만 카운트 증가
    try {
      const statsRef = doc(db, "daily_stats", today);
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        await updateDoc(statsRef, { count: increment(1) });
      } else {
        await setDoc(statsRef, { date: today, count: 1 });
      }

      // 쿠키 설정
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
  // Auth check omitted for now (middleware protects admin routes)

  // 1. 전체 전시 수
  let exhibitionCount = 0;
  try { 
      const snap = await getCountFromServer(collection(db, "exhibitions"));
      exhibitionCount = snap.data().count;
  } catch(e) {}

  // 2. 전체 포트폴리오 수
  let portfolioCount = 0;
  try {
      const snap = await getCountFromServer(collection(db, "portfolios"));
      portfolioCount = snap.data().count;
  } catch(e) {}

  // 3. 전체 미디어 수
  let mediaCount = 0;
  try {
      const snap = await getCountFromServer(collection(db, "media_releases"));
      mediaCount = snap.data().count;
  } catch(e) {}

  // 4. 최근 30일 방문자 통계
  let visitorStats: any[] = [];
  try {
      const q = query(collection(db, "daily_stats"), orderBy("date", "desc"), limit(30));
      const snap = await getDocs(q);
      visitorStats = snap.docs.map(d => d.data()).reverse(); // Graph expects ascending
  } catch(e) {}

  // 5. 오늘의 방문자 수
  const today = new Date().toISOString().split("T")[0];
  const todayStat = visitorStats.find((s) => s.date === today);

  // 6. 전체 누적 방문자 수 (Last 30 days approximation for Dashboard speed)
  // For Real Total, we'd need to fetch ALL daily_stats or keep a total counter.
  // Converting 'count' from all 30 days.
  const totalVisitorCount = visitorStats.reduce((sum, item) => sum + (item.count || 0), 0);
  
  // 7. 일평균 방문자 수
  const averageVisitorCount = visitorStats.length > 0
    ? Math.round(totalVisitorCount / visitorStats.length)
    : 0;

  return {
    exhibitionCount,
    portfolioCount,
    mediaCount,
    todayVisitorCount: todayStat?.count || 0,
    totalVisitorCount, 
    averageVisitorCount,
    visitorStats,
  };
}
