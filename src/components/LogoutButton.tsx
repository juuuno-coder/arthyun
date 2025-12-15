"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
        await signOut(auth);
        router.push("/");
        router.refresh(); 
    } catch (e) {
        console.error("Logout failed", e);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} className="hover:bg-gray-100">
      로그아웃
    </Button>
  );
}
