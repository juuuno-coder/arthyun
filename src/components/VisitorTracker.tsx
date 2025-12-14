"use client";

import { useEffect } from "react";
import { incrementVisitor } from "@/actions/statsActions";

export default function VisitorTracker() {
  useEffect(() => {
    // 서버 액션이 내부적으로 쿠키/IP를 체크하여 중복을 방지하므로
    // 클라이언트에서는 단순히 호출만 합니다.
    // 필요 시 경로 정보 등을 넘길 수 있습니다.
    incrementVisitor().catch((err) => console.error("Stats Error:", err));
  }, []);

  return null;
}
