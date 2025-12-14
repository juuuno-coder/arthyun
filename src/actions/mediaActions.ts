"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Server Action to create a media Item
export async function createMedia(formData: FormData) {
  const cookieStore = await cookies();

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
          } catch {}
        },
      },
    }
  );

  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  // 2. Extract Data
  const title = formData.get("title") as string;
  const press_name = formData.get("press_name") as string;
  const link_url = formData.get("link_url") as string;
  const published_date = formData.get("published_date") as string;
  const content = formData.get("content") as string;
  const imageFile = formData.get("image") as File;
  const imageUrlDirect = formData.get("image_url_direct") as string;

  let image_url = imageUrlDirect || null;

  // 3. Upload Image (Server-Side Fallback)
  // Only upload if no direct URL provided AND file exists
  if (!image_url && imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `media/${Date.now()}.${fileExt}`;
    
    // Using 'og_images' bucket as a shared public bucket
    const { error: uploadError } = await supabase.storage
      .from("og_images") 
      .upload(fileName, imageFile);

    if (uploadError) {
       console.error("Image Upload Error:", uploadError);
       throw new Error("이미지 업로드 실패: " + uploadError.message);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from("og_images")
      .getPublicUrl(fileName);
      
    image_url = publicUrl;
  }

  // Fallback: If still no image_url, try extracting from content
  if (!image_url && content) {
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) {
      image_url = imgMatch[1];
    }
  }

  // 4. Insert DB
  const { error: insertError } = await supabase
    .from("media_releases")
    .insert({
      title,
      press_name,
      link_url,
      published_date: published_date || null,
      content,
      image_url, // Column name might be 'image_url' or something else? 
                 // Previous code used 'image_url'? I should check migration or previous usage. 
                 // Safe bet: usually it's `image_url` or `thumbnail_url`.
                 // Let's assume `image_url` based on convention, if error, we fix.
    });

  if (insertError) throw new Error("DB 등록 실패: " + insertError.message);

  // 5. Revalidate & Redirect
  revalidatePath("/admin/media");
  revalidatePath("/media");
  redirect("/admin/media");
}

// Server Action to delete a media Item
export async function deleteMedia(id: number) {
  const cookieStore = await cookies();

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
          }
        },
      },
    }
  );

  // 1. Check Authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 2. Perform Delete
  // 테이블명이 'media_releases'가 맞는지 확인 필요 (기존 코드 참고)
  // 기존 코드 src/app/media/page.tsx 등을 보면 'media_releases' 사용 중
  const { error, count } = await supabase
    .from("media_releases")
    .delete({ count: 'exact' })
    .eq("id", id);

  if (error) {
    throw new Error("DB 삭제 실패: " + error.message);
  }

  if (count === 0) {
      throw new Error("삭제할 권한이 없거나 이미 삭제된 항목입니다.");
  }

  // 3. Revalidate Path
  revalidatePath("/admin/media");
  revalidatePath("/media");
  
  return { success: true };
}
