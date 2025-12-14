// src/actions/exhibitionActions.ts
"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createExhibition(formData: FormData) {
  try {
    // 1. 폼 데이터 가져오기
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string; // 작가명 등
    const description = formData.get("description") as string; // 에디터 내용
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;
    const is_main_slider = formData.get("is_main_slider") === "on"; // 체크박스 확인

    // 파일 가져오기 (이미지)
    const file = formData.get("poster_image") as File;

    if (!title || !file) {
      return { success: false, message: "제목과 포스터 이미지는 필수입니다." };
    }

    // 2. 이미지 업로드 로직 (Supabase Storage)
    // 파일명 충돌 방지를 위해 현재시간 + 파일명 조합 (한글 파일명은 안전하게 인코딩)
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("images") // 버킷 이름
      .upload(`exhibitions/${fileName}`, file);

    if (uploadError) {
      console.error("Upload Error:", uploadError);
      return { success: false, message: "이미지 업로드 실패" };
    }

    // 3. 업로드된 이미지의 공개 주소(URL) 가져오기
    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(uploadData.path);

    const finalImageUrl = publicUrlData.publicUrl;

    // 4. DB에 정보 저장 (Exhibitions 테이블)
    const youtube_url = formData.get("youtube_url") as string; // 유튜브 URL 추가

    const { error: dbError } = await supabase.from("exhibitions").insert({
      title,
      artist: subtitle, // DB 컬럼명이 artist라면 이렇게 매핑 (subtitle -> artist)
      description,
      start_date,
      end_date,
      is_active: true, // 기본값 활성
      poster_url: finalImageUrl, // DB 컬럼명이 poster_url이라면 이렇게 매핑
      is_main_slider,
      youtube_url: youtube_url || null, // 값이 없으면 null로 저장
    });

    if (dbError) {
      console.error("DB Error:", dbError);
      return { success: false, message: "전시 등록 실패" };
    }

    // 5. 페이지 갱신
    revalidatePath("/"); // 메인 페이지 갱신
    revalidatePath("/archive"); // 아카이브 페이지 갱신
    revalidatePath("/admin/exhibition"); // 관리자 목록 갱신
    
    return { success: true };
  } catch (error) {
    console.error("Server Action Error:", error);
    return { success: false, message: "서버 내부 오류 발생" };
  }
}

export async function deleteExhibition(id: string) {
  const { error } = await supabase.from("exhibitions").delete().eq("id", id);

  if (error) {
    throw new Error("전시 삭제 실패");
  }

  revalidatePath("/admin/exhibition");
  revalidatePath("/archive");
  revalidatePath("/");
}
