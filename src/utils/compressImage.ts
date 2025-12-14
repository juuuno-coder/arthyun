import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1, // 최대 1MB
    maxWidthOrHeight: 1920, // 최대 해상도 FHD
    useWebWorker: true,
    fileType: 'image/webp', // WebP로 변환 (용량 효율 ⬆️)
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // 확장자가 변경될 수 있으므로 파일명도 webp로 교체 권장되나, Supabase 저장을 위해 Blob 그대로 리턴하거나 File로 재생성
    return new File([compressedFile], file.name.replace(/\.[^/.]+$/, ".webp"), { type: 'image/webp' });
  } catch (error) {
    console.error("Image compression error:", error);
    return file; // 실패 시 원본 반환
  }
};
