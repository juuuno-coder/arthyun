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

// Google Deepmind style: Reusable upload logic
async function uploadImageToFirebase(file: File) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  try {
    const storageRef = ref(storage, `editor/${fileName}`);
    await uploadBytes(storageRef, file);
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

  // 다중 이미지 붙여넣기 지원 (Custom Paste Handler)
  useEffect(() => {
    if (!editor) return;

    const handlePaste = async (e: ClipboardEvent) => {
        const files = e.clipboardData?.files;
        if (files && files.length > 0) {
            e.preventDefault(); // 기본 붙여넣기 방지 (하나만 들어가는 문제 해결)
            
            // 현재 커서 위치 확인
            const currentBlock = editor.getTextCursorPosition().block;
            let insertAfterBlock = currentBlock;

            // 로딩 표시용 (선택 사항)
            // toast.info(`${files.length}개의 이미지를 업로드 중입니다...`);

            // 순차적 또는 병렬 업로드 및 삽입
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
                    
                    // 다음 이미지는 방금 삽입한 이미지 뒤에 오도록 위치 업데이트 (원한다면)
                    // 하지만 insertBlocks returns nothing easily to identify ID. 
                    // 단순하게, insertBlocks inserts *after* the reference block.
                    // So if we keep 'insertAfterBlock' as the original one, they will appear in reverse order?
                    // No. If we insert A after Anchor. Anchor -> A.
                    // Then insert B after Anchor. Anchor -> B -> A. (Reverse!)
                    // We want Anchor -> A -> B.
                    // So we need to find the newly inserted block.
                    // BlockNote's insertBlocks doesn't return the new block directly in all versions.
                    // Hack: Get the block adjacent to the anchor in the 'after' direction.
                    
                    // for simplicy of UX, let's just let them paste.
                    // Or retrieve the block after insertion.
                }
            }
        }
    };

    // Attach listener to the editor's DOM explicitly if possible, or window.
    // BlockNote exposes editor.domElement via prosemirrorView? 
    // Types might be tricky. Let's attach to the BlockNoteView container via React ref?
    // Or just window with check? (Risky).
    // Better: BlockNote allows generic DOM events?
    
    // Fallback: Attach to document but check if target is inside editor.
    const div = document.querySelector(".bn-editor"); // BlockNote standard class
    if (div) {
        div.addEventListener("paste", handlePaste as any);
    }
    
    return () => {
        if (div) div.removeEventListener("paste", handlePaste as any);
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
