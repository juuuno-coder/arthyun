// lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

// .env.local 파일에서 환경 변수를 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 필수 환경 변수가 없으면 오류를 발생시킵니다.
if (!supabaseUrl || !supabaseAnonKey) {
  // 이 오류가 아닌, Supabase 클라이언트 자체의 URL 검증 오류가 났으므로
  // URL 값이 있지만 형식이 잘못되었을 가능성이 높습니다.
  throw new Error(
    "환경 변수 (NEXT_PUBLIC_SUPABASE_URL 또는 KEY)를 찾을 수 없습니다. .env.local 파일을 확인하세요."
  );
}

// Supabase 클라이언트 생성 및 내보내기 (여기서 오류가 발생함)
// string | undefined가 아닌 string임을 확실히 하기 위해 ! 를 사용하거나,
// 위에서 이미 검증했으므로 그냥 사용합니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
