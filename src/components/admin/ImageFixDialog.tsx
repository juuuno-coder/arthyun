"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { updatePostContent } from "@/actions/fixActions";
import { Loader2, Upload, RefreshCw } from "lucide-react";

type Props = {
    postId: number;
    content: string;
    onUpdate: (newContent: string) => void;
};

export default function ImageFixDialog({ postId, content, onUpdate }: Props) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    // Extract images on Open
    const extractImages = () => {
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        const found: string[] = [];
        let tempContent = content;
        while ((match = imgRegex.exec(tempContent)) !== null) {
            found.push(match[1]);
        }
        setImages(found);
    };

    const handleFileUpload = async (index: number, file: File) => {
        setIsLoading(true);
        try {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            
            const fileExt = file.name.split('.').pop();
            const fileName = `manual_fix_${postId}_${Date.now()}.${fileExt}`;
            const filePath = `editor/${fileName}`;

            // Upload to images bucket
            const { error: uploadError } = await supabase.storage
                .from("images")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("images")
                .getPublicUrl(filePath);

            // Replace in Content
            const oldUrl = images[index];
            // Safe Replace: content.replace(oldUrl, publicUrl)
            // But if oldUrl appears multiple times? 
            // Usually fine to replace global, or use specific regex.
            // We'll replace ALL occurrences of this URL pattern.
            const newContent = content.split(oldUrl).join(publicUrl);
            
            // Save to DB
            await updatePostContent(postId, newContent);
            
            // Update Local
            onUpdate(newContent);
            extractImages(); // Refresh list (technically content prop should update if parent updates)
            // We'll just wait for parent update or force close?
            // OnUpdate calls parent setter.
            // We should update local images state too?
            const newImages = [...images];
            newImages[index] = publicUrl;
            setImages(newImages);

            toast.success("이미지가 교체되었습니다.");
        } catch (e: any) {
            toast.error("업로드 실패: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v);
            if(v) extractImages();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs h-8 bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
                    <RefreshCw size={12} />
                    이미지 복구 (Manual)
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>이미지 직접 연결 (Manual Mapping)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-gray-500">
                        본문에서 발견된 이미지 링크 목록입니다. 깨진 이미지를 클릭하여 PC에 있는 원본 파일로 교체하세요.
                    </p>
                    
                    {images.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">이미지가 없는 게시물입니다.</div>
                    ) : (
                        <div className="grid gap-4">
                            {images.map((url, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-gray-50 p-2 rounded border">
                                    <div className="w-16 h-16 bg-gray-200 shrink-0 flex items-center justify-center overflow-hidden rounded relative border">
                                        <img src={url} alt="preview" className="w-full h-full object-cover" 
                                             onError={(e) => {
                                                 e.currentTarget.style.display='none';
                                                 e.currentTarget.parentElement!.innerText = "Broken";
                                                 e.currentTarget.parentElement!.className += " text-[10px] text-red-500";
                                             }}
                                        />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs text-gray-500 truncate" title={url}>{url}</p>
                                    </div>
                                    <div className="shrink-0 relative">
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) handleFileUpload(idx, e.target.files[0]);
                                            }}
                                            disabled={isLoading}
                                        />
                                        <Button size="sm" variant="secondary" className="gap-2" disabled={isLoading}>
                                            {isLoading ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14} />}
                                            교체
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
