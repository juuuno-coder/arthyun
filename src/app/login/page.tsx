// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { login } from "@/actions/authActions"; // 곧 만들 파일

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");

    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // 성공하면 서버 액션에서 리다이렉트하므로 처리 불필요
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-serif font-bold text-center mb-8">
          ADMIN
        </h1>

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              name="email"
              type="email"
              className="w-full border p-3 focus:outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Password</label>
            <input
              name="password"
              type="password"
              className="w-full border p-3 focus:outline-none focus:border-black"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 font-bold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
}
