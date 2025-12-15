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

import { compressImage } from "@/utils/compressImage";

// Google Deepmind style: Reusable upload logic
async function uploadImageToFirebase(file: File) {
  // 1. Compress Image
  const compressedFile = await compressImage(file);
  
  // 2. Upload
  const fileExt = compressedFile.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  try {
    const storageRef = ref(storage, `editor/${fileName}`);
    await uploadBytes(storageRef, compressedFile);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error uploading image:", error);
    return "https://via.placeholder.com/150?text=Upload+Error";
  }
}

export default function Editor({ onChange, initialContent }: EditorProps) {
  // 에디터 생성
  const editor = useCreateBlockNote({
    uploadFile: uploadImageToFirebase,
  });

  // 초기 내용 로드
  useEffect(() => {
    async function loadInitialContent() {
      if (initialContent && editor) {
        const blocks = await editor.tryParseHTMLToBlocks(initialContent);
        editor.replaceBlocks(editor.document, blocks);
      }
    }
    loadInitialContent();
  }, [editor]); // Run once when editor is ready

  // 내용이 바뀔 때마다 실행되는 함수
  const handleChange = async () => {
    const html = await editor.blocksToHTMLLossy(editor.document);
    onChange(html);
  };

  return (
    <div className="border border-gray-300 rounded-md min-h-[300px] p-2 relative">
      <BlockNoteView editor={editor} onChange={handleChange} theme="light" />
      {/* 팁 표시 */}
      <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 pointer-events-none">
        Tip: 여러 이미지를 복사해서 한꺼번에 붙여넣을 수 있습니다.
      </div>
    </div>
  );
}
