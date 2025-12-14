"use client";

import React from "react";

export default function MainBackground({ youtubeUrl }: { youtubeUrl?: string | null }) {
    // 유튜브 ID 추출 함수
    const getYoutubeId = (url: string | null | undefined) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeId(youtubeUrl) || "AMlZ14j5DtQ"; // Default fallback

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-black pointer-events-none">
            <div className="absolute inset-0 w-full h-full">
                <iframe
                    className="absolute top-1/2 left-1/2 w-[177.77vh] h-[56.25vw] min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.3] pointer-events-none"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&origin=http://localhost:3000`}
                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                    style={{ pointerEvents: 'none' }}
                />
                {/* 반투명 오버레이 */}
                <div className="absolute inset-0 bg-black/40" />
            </div>
        </div>
    );
}
