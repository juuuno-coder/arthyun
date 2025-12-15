// src/components/Editor.tsx
"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect } from "react";
import "@blocknote/mantine/style.css"; 
// import { supabase } from "@/lib/supabase"; // REMOVED
import { storage } from "@/lib/firebase"; // Added Firebase
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface EditorProps {
  onChange: (html: string) => void; 
  initialContent?: string;
}

export default function Editor({ onChange, initialContent }: EditorProps) {
  // 에디터 생성
  const editor = useCreateBlockNote({
    uploadFile: async (file: File) => {
      // 1. 파일명 생성 (충돌 방지)
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      try {
        // 2. Firebase Storage에 업로드
        const storageRef = ref(storage, `editor/${fileName}`);
        
        // Upload (Using standard uploadBytes for simplicity in Editor)
        await uploadBytes(storageRef, file);
        const publicUrl = await getDownloadURL(storageRef);

        return publicUrl;
      } catch (error) {
        console.error("Error uploading image:", error);
        return "https://via.placeholder.com/150?text=Upload+Error";
      }
    },
  });

  // 초기 내용 로드 (HTML -> Blocks)
  useEffect(() => {
    async function loadInitialContent() {
      if (initialContent && editor) {
        const blocks = await editor.tryParseHTMLToBlocks(initialContent);
        editor.replaceBlocks(editor.document, blocks);
      }
    }
    loadInitialContent();
  }, [editor]); 

  // 내용이 바뀔 때마다 실행되는 함수
  const handleChange = async () => {
    // 블록을 HTML로 변환
    const html = await editor.blocksToHTMLLossy(editor.document);
    onChange(html);
  };

  return (
    <div className="border border-gray-300 rounded-md min-h-[300px] p-2">
      <BlockNoteView editor={editor} onChange={handleChange} theme="light" />
    </div>
  );
}
