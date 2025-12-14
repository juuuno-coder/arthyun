"use client";

import { useEffect } from "react";
import { incrementVisitor } from "@/actions/statsActions";

export default function VisitorTracker() {
  useEffect(() => {
    // 세션 스토리지 체크 (새로고침 시 중복 카운팅 방지)
    // 브라우저 닫았다 켜면 다시 카운트 (세션 기준)
    const hasVisited = sessionStorage.getItem("artway_visited");

    if (!hasVisited) {
      incrementVisitor()
        .then(() => {
          sessionStorage.setItem("artway_visited", "true");
          console.log("📈 Visitor Counted");
        })
        .catch((err) => console.error("Stats Error:", err));
    }
  }, []);

  return null; // 렌더링 할 UI 없음
}
