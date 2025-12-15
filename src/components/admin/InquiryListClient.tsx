"use client";

import { useState } from "react";
// import { createBrowserClient } from "@supabase/ssr";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";

type Inquiry = {
  id: string;
  type: "general" | "exhibition";
  name: string;
  phone: string;
  email: string | null;
  content: string;
  status: "new" | "read" | "done";
  created_at: string;
};

export default function InquiryListClient({ initialInquiries }: { initialInquiries: Inquiry[] }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [filter, setFilter] = useState("all"); // all, new, exhibition, general
  const [updating, setUpdating] = useState(false);

  // No Supabase Client needed
  // Instead use Server Actions or Client DB SDK? 
  // Since we are client-side only here for simplicity (though Server Action is better), 
  // let's use Firebase Client SDK (import db).
  // Ideally, use a Server Action, but for speed to fix user issue, direct SDK is fine if rules allow.
  // Actually, let's create a server action if we want to be clean, but user wants it fixed now.
  // Let's use direct client SDK update.
  
  const updateStatus = async (id: string, newStatus: "new" | "read" | "done") => {
    setUpdating(true);
    // Dynamic import to avoid server-side issues (though this is "use client")
    const { doc, updateDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    try {
        const docRef = doc(db, "inquiries", id);
        await updateDoc(docRef, { status: newStatus });
        
        setInquiries((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        if (selectedInquiry?.id === id) {
            setSelectedInquiry({ ...selectedInquiry, status: newStatus });
        }
    } catch (error: any) {
        alert("업데이트 실패: " + error.message);
    }
    setUpdating(false);
  };

  // 필터링
  const filteredInquiries = inquiries.filter((item) => {
    if (filter === "all") return true;
    if (filter === "new") return item.status === "new";
    if (filter === "exhibition") return item.type === "exhibition";
    if (filter === "general") return item.type === "general";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 필터 옵션 */}
      <div className="flex gap-2">
        {["all", "new", "general", "exhibition"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize"
            size="sm"
          >
            {f === "all" ? "전체 보기" : f === "new" ? "신규 미확인" : f === "general" ? "일반 문의" : "전시 신청"}
          </Button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[100px]">상태</TableHead>
              <TableHead className="w-[100px]">유형</TableHead>
              <TableHead>이름</TableHead>
              <TableHead className="hidden md:table-cell">연락처</TableHead>
              <TableHead className="hidden md:table-cell">접수일</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInquiries.length > 0 ? (
              filteredInquiries.map((item) => (
                <TableRow key={item.id} className={item.status === 'new' ? 'bg-blue-50/50' : ''}>
                  <TableCell>
                    {item.status === "new" && <Badge className="bg-red-500 hover:bg-red-600">신규</Badge>}
                    {item.status === "read" && <Badge variant="outline" className="text-blue-600 border-blue-200">확인중</Badge>}
                    {item.status === "done" && <Badge variant="secondary" className="text-gray-500">완료</Badge>}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-xs">
                        {item.type === "exhibition" ? "전시신청" : "일반문의"}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-gray-500 text-sm">{item.phone}</TableCell>
                  <TableCell className="hidden md:table-cell text-gray-400 text-sm">
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInquiry(item);
                            if (item.status === "new") updateStatus(item.id, "read");
                          }}
                        >
                          <Eye size={16} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {selectedInquiry?.type === "exhibition" ? "🎨 전시 및 대관 신청" : "💬 일반 문의"}
                            <span className="text-xs font-normal text-gray-400 ml-auto">
                              {selectedInquiry?.created_at.split("T")[0]}
                            </span>
                          </DialogTitle>
                        </DialogHeader>
                        
                        {selectedInquiry && (
                          <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-bold text-gray-500 mb-1">성함</p>
                                <p>{selectedInquiry.name}</p>
                              </div>
                              <div>
                                <p className="font-bold text-gray-500 mb-1">연락처</p>
                                <p>{selectedInquiry.phone}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="font-bold text-gray-500 mb-1">이메일</p>
                                <p>{selectedInquiry.email || "-"}</p>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border">
                              <p className="font-bold text-gray-500 mb-2">내용</p>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {selectedInquiry.content}
                              </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Select 
                                    value={selectedInquiry.status} 
                                    onValueChange={(val: any) => updateStatus(selectedInquiry.id, val)}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="상태 변경" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">🔴 신규 접수</SelectItem>
                                        <SelectItem value="read">🔵 확인 중</SelectItem>
                                        <SelectItem value="done">⚫ 처리 완료</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                  문의 내역이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
