"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("계정이 생성되었습니다! 자동으로 로그인됩니다.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Login Success
      router.push("/admin");
    } catch (err: any) {
      console.error(isRegistering ? "Registration failed" : "Login failed", err);
      
      if (err.code === "auth/email-already-in-use") {
          setError("이미 존재하는 이메일입니다. 로그인해주세요.");
          setIsRegistering(false);
      } else if (err.code === "auth/weak-password") {
          setError("비밀번호는 6자리 이상이어야 합니다.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
         // Generic Error
        setError("오류가 발생했습니다: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-serif font-bold text-center mb-8">
          {isRegistering ? "CREATE ADMIN" : "ADMIN LOGIN"}
          <span className="block text-xs font-sans font-normal text-gray-400 mt-2 tracking-widest uppercase">
            Firebase Auth
          </span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-3 focus:outline-none focus:border-black"
              required
              placeholder="admin@arthyun.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Password</label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Processing..." : (isRegistering ? "CREATE ACCOUNT" : "LOGIN")}
          </button>
          
          <div className="text-center pt-2">
            <button 
                type="button"
                onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError("");
                }}
                className="text-xs text-gray-500 hover:text-black underline"
            >
                {isRegistering ? "이미 계정이 있으신가요? 로그인하기" : "계정이 없으신가요? 새로 만들기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
