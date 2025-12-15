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
  instagram_access_token?: string;
  instagram_user_id?: string;
  is_instagram_active?: boolean;
};

export default function SettingsFormClient({ settings }: { settings: Settings | null }) {
  const [description, setDescription] = useState(settings?.og_description || "");
  const [imageUrl, setImageUrl] = useState(settings?.og_image_url || "");
  const [instagramToken, setInstagramToken] = useState(settings?.instagram_access_token || "");
  const [instagramUserId, setInstagramUserId] = useState(settings?.instagram_user_id || "");
  const [isInstagramActive, setIsInstagramActive] = useState(settings?.is_instagram_active || false);

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
    formData.append("instagramToken", instagramToken);
    formData.append("instagramUserId", instagramUserId);
    formData.append("isInstagramActive", String(isInstagramActive));

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

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* 기존 OG 설정 */}
        <div className="space-y-8">
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
        </div>

        <hr className="border-gray-200" />

        {/* 🚀 인스타그램 연동 설정 */}
        <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-pink-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                인스타그램 연동
            </h2>
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="insta-active"
                        checked={isInstagramActive}
                        onChange={(e) => setIsInstagramActive(e.target.checked)}
                        className="w-5 h-5 accent-pink-600"
                    />
                    <label htmlFor="insta-active" className="font-bold text-gray-900 cursor-pointer">
                        인스타그램 연동 활성화
                    </label>
                </div>

                <div className="space-y-4">
                    {/* New: Login Button */}
                    <div className="p-4 border rounded bg-white">
                        <label className="block text-sm font-bold text-gray-700 mb-2">자동 연결 (권장)</label>
                        <p className="text-xs text-gray-500 mb-3">
                            비즈니스 계정과 연결된 Facebook 로그인을 통해 토큰을 자동으로 가져옵니다.
                        </p>
                        <a 
                            href="/api/instagram/login"
                            className="inline-flex items-center justify-center px-4 py-2 bg-[#1877F2] text-white rounded font-medium text-sm hover:bg-[#166fe5] transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Instagram (Facebook) 로그인으로 연결
                        </a>
                    </div>
                
                    {/* Manual Fallback */}
                    <div className="pt-4 border-t">
                        <details className="text-sm">
                            <summary className="cursor-pointer font-medium text-gray-500 hover:text-gray-700">고급: 수동 입력 (개발자용)</summary>
                            <div className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Access Token (액세스 토큰)</label>
                                    <input 
                                        type="password" 
                                        value={instagramToken}
                                        onChange={(e) => setInstagramToken(e.target.value)}
                                        placeholder="Meta Developer 센터에서 발급받은 Long-lived Token"
                                        className="w-full border rounded-md p-3 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">User ID (선택사항)</label>
                                    <input 
                                        type="text" 
                                        value={instagramUserId}
                                        onChange={(e) => setInstagramUserId(e.target.value)}
                                        placeholder="User ID (자동 연결 시 자동 저장됨)"
                                        className="w-full border rounded-md p-3 text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    />
                                </div>
                            </div>
                        </details>
                    </div>
                </div>

                {isInstagramActive && (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-yellow-800">
                        ⚠ <strong>주의사항:</strong> 연동 활성화 시 포트폴리오 목록이 인스타그램 피드로 대체됩니다.
                        (60일마다 토큰 갱신이 필요할 수 있습니다.)
                    </div>
                )}
            </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end pt-6 border-t">
            <Button type="submit" disabled={loading} size="lg" className="bg-black text-white hover:bg-gray-800">
                <Save className="w-4 h-4 mr-2" />
                {loading ? "저장 중..." : "모든 설정 저장"}
            </Button>
        </div>
      </form>
    </div>
  );
}
