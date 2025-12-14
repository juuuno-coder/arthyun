"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { updateSiteSettings } from "@/actions/settingsActions";
import { Upload, ImageIcon, Save } from "lucide-react";

type Settings = {
  id: number;
  og_description: string | null;
  og_image_url: string | null;
};

export default function SettingsFormClient({ settings }: { settings: Settings | null }) {
  const [description, setDescription] = useState(settings?.og_description || "");
  const [imageUrl, setImageUrl] = useState(settings?.og_image_url || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(settings?.og_image_url || null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("description", description);
    if (file) {
      formData.append("image", file);
    }
    // 기존 이미지가 있고 새 파일이 없으면 기존 URL 유지
    if (imageUrl && !file) {
      formData.append("existingImage", imageUrl);
    }

    const res = await updateSiteSettings(formData);
    
    setLoading(false);
    if (res?.error) {
      alert("저장 실패: " + res.error);
    } else {
      alert("성공적으로 저장되었습니다! 카카오톡 등에서는 캐시 갱신까지 시간이 걸릴 수 있습니다.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <ImageIcon className="w-6 h-6" />
        오픈 그래프 (공유 썸네일) 설정
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 미리보기 영역 */}
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">미리보기 (1200 x 630 권장)</label>
            <div className="relative aspect-[1.91/1] w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center group">
                {preview ? (
                    <img 
                        src={preview} 
                        alt="OG Preview" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-center text-gray-400">
                        <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>이미지가 없습니다</p>
                    </div>
                )}
                
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-medium pointer-events-none">
                    클릭 또는 드래그하여 이미지 변경
                </div>
            </div>
            <p className="text-xs text-gray-400">
                * 카카오톡, 페이스북 등 링크 공유 시 보여질 이미지입니다.
            </p>
        </div>

        {/* 설명 입력 */}
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">공유 설명 문구</label>
            <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 부산 동구의 현대미술 갤러리 Artway입니다."
                className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-black"
            />
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
            <Button type="submit" disabled={loading} size="lg">
                <Save className="w-4 h-4 mr-2" />
                {loading ? "저장 중..." : "설정 저장"}
            </Button>
        </div>
      </form>
    </div>
  );
}
