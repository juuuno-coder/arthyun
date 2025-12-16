// ... imports ...
import { Badge } from "@/components/ui/badge"; 
// ...

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

export default function EditPortfolioPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [isDragging, setIsDragging] = useState(false);

    // Form States
    const [title, setTitle] = useState("");
    const [client, setClient] = useState("");
    // const [location, setLocation] = useState(""); // Unused effectively? Let's keep if needed or remove if clutter. Removed in write page. 
    // Write page removed it. I will remove it here too for consistency unless needed.
    const [completionDate, setCompletionDate] = useState("");
    const [categories, setCategories] = useState<string[]>([]);
    const [content, setContent] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
    const [isVisible, setIsVisible] = useState(true); 
    const [isFeatured, setIsFeatured] = useState(false); 

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "portfolios", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTitle(data.title);
                    setClient(data.client || "");
                    // setLocation(data.location || "");
                    setCompletionDate(data.completion_date || "");
                    
                    // Priority: data.categories acts as source of truth if exists
                    if (data.categories && Array.isArray(data.categories)) {
                         setCategories(data.categories);
                    } else {
                         // Fallback to legacy single category
                         setCategories(data.category ? [data.category] : ["Public Art"]);
                    }

                    setContent(data.description || "");
                    setThumbnailUrl(data.thumbnail_url);
                    setIsVisible(data.is_visible ?? true);
                    setIsFeatured(data.is_featured || false);
                } else {
                    toast.error("데이터를 찾을 수 없습니다.");
                    router.push("/admin/portfolio");
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                toast.error("데이터를 불러오지 못했습니다.");
            } finally {
                setIsFetching(false);
            }
        };
        fetchData();
    }, [id, router]);

    const toggleCategory = (value: string) => {
        setCategories(prev => {
            if (prev.includes(value)) {
                if (prev.length === 1) return prev; 
                return prev.filter(c => c !== value);
            } else {
                return [...prev, value];
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let finalThumbnailUrl = thumbnailUrl;

            if (newThumbnailFile) {
                const compressedFile = await compressImage(newThumbnailFile);
                const fileName = `portfolio/${Date.now()}.webp`;
                const storageRef = ref(storage, `og_images/${fileName}`);
                await uploadBytes(storageRef, compressedFile);
                finalThumbnailUrl = await getDownloadURL(storageRef);
            }

            const docRef = doc(db, "portfolios", id);
            await updateDoc(docRef, {
                title,
                client,
                // location,
                completion_date: completionDate === "" ? null : completionDate,
                category: categories[0], // Legacy support
                categories: categories,  // New support
                description: content,
                thumbnail_url: finalThumbnailUrl,
                is_visible: isVisible,
                is_featured: isFeatured,
                updated_at: new Date().toISOString()
            });

            toast.success("수정되었습니다.");
            router.push("/admin/portfolio");
            router.refresh(); 

        } catch (error: any) {
            toast.error("수정 실패: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setNewThumbnailFile(e.dataTransfer.files[0]);
        }
    };

    if (isFetching) return <div className="p-20 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto py-20 px-6">
            <h1 className="text-3xl font-serif font-bold mb-10">포트폴리오 수정</h1>

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
                </div>

                {/* Row 3: Title */}
                <div className="space-y-2">
                    <Label className="text-lg font-bold">프로젝트명</Label>
                    <Input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
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
                     <Label>대표 이미지 (변경 시 선택)</Label>
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
                            onChange={(e) => setNewThumbnailFile(e.target.files?.[0] || null)}
                        />
                        
                        {newThumbnailFile ? (
                            <div className="text-center w-full">
                                <div className="relative w-full h-80 mb-4 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={URL.createObjectURL(newThumbnailFile)} 
                                        alt="Preview" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                                <p className="text-sm text-green-600 font-medium bg-green-50 inline-block px-3 py-1 rounded-full">
                                    {newThumbnailFile.name} (새로운 이미지)
                                </p>
                                <p className="text-xs text-gray-400 mt-1">클릭하거나 드래그하여 변경</p>
                            </div>
                        ) : thumbnailUrl ? (
                            <div className="text-center w-full">
                                <div className="relative w-full h-80 mb-4 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={thumbnailUrl} 
                                        alt="Current" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                                <p className="text-sm text-gray-600 font-medium">
                                    현재 등록된 이미지
                                </p>
                                <p className="text-xs text-gray-400 mt-1">변경하려면 클릭하거나 드래그하세요</p>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-600 font-medium mb-1">이미지를 드래그하거나 클릭하여 업로드</p>
                                <p className="text-xs text-gray-400">JPG, PNG, GIF (최대 10MB)</p>
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
                        {isLoading ? "저장 중..." : "수정 저장"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
