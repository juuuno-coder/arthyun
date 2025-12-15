// lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

// .env.local 파일에서 환경 변수를 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 필수 환경 변수가 없으면 오류를 발생시킵니다.
// [MIGRATION NOTE]: Supabase is being removed. This file maintains compatibility to prevent crashes.
// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error(
//     "환경 변수 (NEXT_PUBLIC_SUPABASE_URL 또는 KEY)를 찾을 수 없습니다. .env.local 파일을 확인하세요."
//   );
// }

// Return a dummy client or null if keys are missing to prevent crash during import
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : (() => {
        console.warn("Supabase Client accessed but keys are missing. Migration in progress.");
        return null; 
      })() as any;
