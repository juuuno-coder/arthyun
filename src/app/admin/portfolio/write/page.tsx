// ... imports ...
import { Badge } from "@/components/ui/badge"; 
// Ensure Badge is imported. 
// Also standard imports..

const CATEGORIES = [
    { value: "PublicArtDesign", label: "공공미술/디자인" },
    { value: "Culture", label: "문화예술" },
    { value: "Exhibition", label: "전시/박람회" },
    { value: "Space", label: "공간조성" },
    { value: "Sculpture", label: "조형물" },
    { value: "Painting", label: "페인팅" },
    { value: "Festival", label: "축제/이벤트" },
    { value: "Education", label: "체험/교육" },
    { value: "Other", label: "기타" }
];

// ... inside component ...

    const [isVisible, setIsVisible] = useState(true); // Default Visible
    const [categories, setCategories] = useState<string[]>(["PublicArtDesign"]); // Multi-select

    const toggleCategory = (value: string) => {
        setCategories(prev => {
            if (prev.includes(value)) {
                if (prev.length === 1) return prev; // Prevent empty
                return prev.filter(c => c !== value);
            } else {
                return [...prev, value];
            }
        });
    };

    // ... handleSubmit ...
    // Inside handleSubmit:
    const docData = {
        title,
        client,
        location: null,
        completion_date: completionDate || null,
        category: categories[0], // Primary Category (Back-compat)
        categories: categories,  // New Array Field
        description: content,
        thumbnail_url: thumbnailUrl,
        is_visible: isVisible,
        is_featured: isFeatured,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    // ...

    return (
        <div className="max-w-4xl mx-auto py-20 px-6">
            <h1 className="text-3xl font-serif font-bold mb-10">새 포트폴리오 등록</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Row 1: Visibility & Featured */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Visibility */}
                    <div className="flex-1 flex items-center space-x-3 border p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition cursor-pointer" onClick={() => setIsVisible(!isVisible)}>
                        <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={(e) => setIsVisible(e.target.checked)}
                            className="w-5 h-5 accent-black cursor-pointer"
                        />
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900">공개 (Public)</span>
                            <span className="text-xs text-gray-500">체크 해제 시 관리자에게만 보입니다.</span>
                        </div>
                    </div>

                    {/* Featured */}
                    <div className="flex-1 flex items-center space-x-3 border p-4 rounded-xl bg-blue-50 border-blue-100 hover:bg-blue-100 transition cursor-pointer" onClick={() => setIsFeatured(!isFeatured)}>
                        <input
                            type="checkbox"
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                            className="w-5 h-5 accent-blue-600 cursor-pointer"
                        />
                         <div className="flex flex-col">
                            <span className="font-bold text-blue-900">메인 슬라이드 (Featured)</span>
                            <span className="text-xs text-blue-700">메인 페이지 상단 슬라이드에 노출</span>
                        </div>
                    </div>
                </div>

                {/* Row 2: Categories (Tag Cloud) */}
                <div className="space-y-3">
                    <Label className="text-lg font-bold">카테고리</Label>
                    <div className="flex flex-wrap gap-2 p-4 border rounded-xl bg-white">
                        {CATEGORIES.map(cat => (
                            <Badge
                                key={cat.value}
                                variant={categories.includes(cat.value) ? "default" : "outline"}
                                className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                                    categories.includes(cat.value) 
                                    ? "bg-black text-white hover:bg-gray-800 scale-105" 
                                    : "text-gray-500 border-gray-200 hover:border-black hover:text-black"
                                }`}
                                onClick={() => toggleCategory(cat.value)}
                            >
                                {cat.label}
                            </Badge>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 pl-1">* 첫 번째 선택된 카테고리가 대표 카테고리로 설정됩니다.</p>
                </div>

                {/* Row 3: Title */}
                <div className="space-y-2">
                    <Label className="text-lg font-bold">프로젝트명</Label>
                    <Input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="프로젝트명을 입력하세요" 
                        required 
                        className="h-14 text-lg font-medium"
                    />
                </div>

                {/* Row 4: Client & Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>발주처 / 클라이언트</Label>
                        <Input 
                            value={client} 
                            onChange={(e) => setClient(e.target.value)} 
                            placeholder="예: 부산광역시" 
                            className="h-12"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label>프로젝트 완료일</Label>
                        <div className="relative">
                            <Input 
                                type="date"
                                value={completionDate} 
                                onChange={(e) => setCompletionDate(e.target.value)} 
                                className="h-12 w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Thumbnail */}
                <div className="space-y-2">
                    <Label>대표 이미지 (썸네일)</Label>
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${
                            isDragging ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        onClick={() => document.getElementById('thumbnail-upload')?.click()}
                    >
                        <input
                            id="thumbnail-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        />
                        
                        {thumbnailFile ? (
                            <div className="text-center w-full">
                                <div className="relative w-full h-80 mb-4 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={URL.createObjectURL(thumbnailFile)} 
                                        alt="Preview" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                                <p className="text-sm text-green-600 font-medium bg-green-50 inline-block px-3 py-1 rounded-full">
                                    {thumbnailFile.name}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-600 font-medium mb-1">이미지를 드래그하거나 클릭하여 업로드</p>
                                <p className="text-xs text-gray-400">최대 10MB (JPG, PNG)</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-lg font-bold">상세 내용</Label>
                    <div className="min-h-[500px] border rounded-md">
                        <Editor initialContent={content} onChange={setContent} />
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-10 pb-20">
                    <Button type="button" variant="outline" onClick={() => router.back()} size="lg">
                        취소
                    </Button>
                    <Button type="submit" className="bg-black text-white hover:bg-gray-800" disabled={isLoading} size="lg">
                        {isLoading ? "등록 중..." : "포트폴리오 등록"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
