"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type InquiryData = {
  type: "general" | "exhibition";
  name: string;
  phone: string;
  email: string;
  content: string;
};

export async function submitInquiry(data: InquiryData) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { error } = await supabase.from("inquiries").insert({
    type: data.type,
    name: data.name,
    phone: data.phone,
    email: data.email,
    content: data.content,
  });

  if (error) {
    console.error("Inquiry Error:", error);
    return { success: false, message: "접수 중 오류가 발생했습니다." };
  }

  return { success: true, message: "성공적으로 접수되었습니다. 담당자가 확인 후 연락드리겠습니다." };
}
