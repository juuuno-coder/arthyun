"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Server Action to delete a portfolio
export async function deletePortfolio(id: number) {
  const cookieStore = await cookies();

  // Create a Supabase client with the user's cookies (session)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // 1. Check Authentication (Extra safety layer)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 2. Perform Delete
  const { error, count } = await supabase
    .from("portfolios")
    .delete({ count: 'exact' }) // 요청: 정확한 삭제 개수 반환
    .eq("id", id);

  if (error) {
    throw new Error("DB 삭제 실패: " + error.message);
  }

  // If RLS blocked it or item didn't exist, count will be 0
  if (count === 0) {
      throw new Error("삭제할 권한이 없거나 이미 삭제된 항목입니다.");
  }

  // 3. Revalidate Path
  revalidatePath("/admin/portfolio");
  revalidatePath("/portfolio");
  
  return { success: true };
}
