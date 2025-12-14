"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
           try {
             cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
           } catch { }
        },
      },
    }
  );
}

export async function updatePostContent(id: number, content: string) {
    const supabase = await getSupabase();
    
    // Check Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Update
    const { error } = await supabase
        .from("migrated_posts")
        .update({ content })
        .eq("id", id);
    
    if (error) throw new Error(error.message);

    revalidatePath("/archive");
    return { success: true };
}
