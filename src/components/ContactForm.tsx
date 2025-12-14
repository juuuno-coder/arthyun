"use client";

import { useState } from "react";
import { submitInquiry } from "@/actions/inquiryActions";
import { Button } from "@/components/ui/button";

export default function ContactForm() {
  const [tab, setTab] = useState<"general" | "exhibition">("general");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    content: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.content) {
      alert("성함, 연락처, 내용은 필수 입력 항목입니다.");
      return;
    }

    setLoading(true);
    const result = await submitInquiry({ ...form, type: tab });
    setLoading(false);

    if (result.success) {
      alert(result.message);
      setForm({ name: "", phone: "", email: "", content: "" });
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="bg-white p-8 md:p-12 border border-gray-100 shadow-sm rounded-xl">
      {/* 탭 버튼 */}
      <div className="flex gap-4 mb-8 border-b border-gray-100 pb-1">
        <button
          onClick={() => setTab("general")}
          className={`pb-3 text-lg font-serif transition border-b-2 ${
            tab === "general"
              ? "border-black text-black font-bold"
              : "border-transparent text-gray-400 hover:text-black"
          }`}
        >
          강의 문의
        </button>
        <button
          onClick={() => setTab("exhibition")}
          className={`pb-3 text-lg font-serif transition border-b-2 ${
            tab === "exhibition"
              ? "border-black text-black font-bold"
              : "border-transparent text-gray-400 hover:text-black"
          }`}
        >
          프로젝트 문의
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-1">
            {tab === "general" ? "문의하실 내용을 남겨주세요" : "작가님의 정보를 남겨주세요"}
        </h3>
        <p className="text-xs text-gray-500">
            {tab === "general" 
                ? "교육 프로그램, 특강, 워크숍 등 강의 관련 문의를 자유롭게 남겨주세요." 
                : "공공미술, 디자인, 벽화 등 프로젝트 협업 제안을 남겨주세요."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">성함 (필수)</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="홍길동"
              className="w-full border border-gray-200 px-4 py-3 rounded-md focus:outline-none focus:border-black transition"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1 block">연락처 (필수)</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
              className="w-full border border-gray-200 px-4 py-3 rounded-md focus:outline-none focus:border-black transition"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 mb-1 block">이메일 (선택)</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@email.com"
            className="w-full border border-gray-200 px-4 py-3 rounded-md focus:outline-none focus:border-black transition"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 mb-1 block">내용 (필수)</label>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder={tab === "general" ? "강의 주제, 대상, 희망 일정 등 문의 내용을 입력해주세요." : "프로젝트 내용, 예산, 일정 등 제안 내용을 입력해주세요."}
            rows={5}
            className="w-full border border-gray-200 px-4 py-3 rounded-md focus:outline-none focus:border-black transition resize-none"
          />
        </div>

        <Button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-6 mt-4 hover:bg-gray-800"
        >
            {loading ? "전송 중..." : "문의하기 / 신청하기"}
        </Button>
      </form>
    </div>
  );
}
