"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// 설정 조회
export async function getSiteSettings() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Error fetching settings:", error);
    return null;
  }

  return data;
}

// 설정 업데이트
export async function updateSiteSettings(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Action에서 쿠키 설정 가능
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Server Action에서 쿠키 설정 가능
          }
        },
      },
    }
  );

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const description = formData.get("description") as string;
  const imageFile = formData.get("image") as File;
  let imageUrl = formData.get("existingImage") as string;

  // 새 이미지가 업로드된 경우
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `og-image-${Date.now()}.${fileExt}`;
    const filePath = `settings/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("og_images")
      .upload(filePath, imageFile);

    if (uploadError) {
      return { error: "이미지 업로드 실패: " + uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("og_images")
      .getPublicUrl(filePath);

    imageUrl = publicUrlData.publicUrl;
  }

  // DB 업데이트
  const { error: updateError } = await supabase
    .from("site_settings")
    .upsert({
      id: 1,
      og_description: description,
      og_image_url: imageUrl,
      updated_at: new Date().toISOString(),
    });

  if (updateError) {
    return { error: "설정 저장 실패: " + updateError.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");
  
  return { success: true };
}
