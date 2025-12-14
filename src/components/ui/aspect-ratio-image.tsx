"use client";

import * as React from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

// 1. ShadCN 스타일의 Aspect Ratio 래퍼 활용 (간편한 비율 조정)
// 2. 로딩 상태 스켈레톤 (선택 사항)
// 3. Fallback 이미지 처리

interface AspectRatioImageProps extends Omit<ImageProps, "className"> {
  wrapperClassName?: string;
  imageClassName?: string;
  aspectRatio?: number; // 가로/세로 비율 (예: 16/9)
  fallbackSrc?: string;
}

export function AspectRatioImage({
  src,
  alt,
  wrapperClassName,
  imageClassName,
  aspectRatio,
  fallbackSrc = "/images/placeholder.png",
  fill = true, // 기본적으로 부모 컨테이너를 채우도록 설정
  ...props
}: AspectRatioImageProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // 비율이 지정된 경우 padding-bottom 기법 사용
  const style = aspectRatio
    ? { paddingBottom: `${(1 / aspectRatio) * 100}%` }
    : undefined;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-gray-100",
        wrapperClassName
      )}
      style={style}
    >
      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
      )}

      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        fill={fill}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          imageClassName
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
            setError(true);
            setIsLoading(false);
        }}
        {...props}
      />
    </div>
  );
}
