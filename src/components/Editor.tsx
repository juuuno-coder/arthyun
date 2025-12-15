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
  }, [editor]); 

  // 다중 이미지 붙여넣기 지원 (Custom Paste Handler)
  // 중복 업로드 방지를 위해 캡처 단계(true)에서 이벤트를 가로채고 중단합니다.
  useEffect(() => {
    if (!editor) return;

    const handlePaste = async (e: ClipboardEvent) => {
        const files = e.clipboardData?.files;
        // 파일이 있는 경우에만 개입
        if (files && files.length > 0) {
             // 이미지 파일이 하나라도 있는지 확인
            let hasImage = false;
            for (let i = 0; i < files.length; i++) {
                if (files[i].type.startsWith("image/")) {
                    hasImage = true;
                    break;
                }
            }

            if (hasImage) {
                e.preventDefault(); 
                e.stopPropagation(); // BlockNote의 기본 핸들러가 실행되지 않도록 차단

                // 현재 커서 위치 확인
                const currentBlock = editor.getTextCursorPosition().block;
                let insertAfterBlock = currentBlock;

                // 순차적 업로드 및 삽입
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (file.type.startsWith("image/")) {
                        const url = await uploadImageToFirebase(file);
                        
                        // 이미지 블록 생성
                        const newBlocks: any = [
                            {
                                type: "image",
                                props: {
                                    url: url,
                                    name: file.name,
                                    showPreview: true
                                }
                            }
                        ];

                        // 블록 삽입
                        editor.insertBlocks(newBlocks, insertAfterBlock, "after");
                        
                        // 다음 이미지가 올바른 순서로 들어가도록 처리 (선택 사항)
                        // 현재 로직은 계속 같은 블록 뒤에 넣으므로 역순이 될 수 있음.
                        // 하지만 BlockNote API 한계상 단순화.
                    }
                }
            }
        }
    };

    const div = document.querySelector(".bn-editor");
    if (div) {
        // useCapture: true로 설정하여 버블링 전에 가로챔
        div.addEventListener("paste", handlePaste as any, true);
    }
    
    return () => {
        if (div) div.removeEventListener("paste", handlePaste as any, true);
    };

  }, [editor]);

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
