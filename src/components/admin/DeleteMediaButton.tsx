"use client";

import { startTransition, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMedia } from "@/actions/mediaActions";

export default function DeleteMediaButton({ id }: { id: string | number }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!confirm("정말로 이 보도자료를 삭제하시겠습니까? (복구 불가)")) return;

    startTransition(async () => {
      try {
        await deleteMedia(id);
        toast.success("보도자료가 삭제되었습니다.");
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
    >
      <Trash2 size={14} />
    </Button>
  );
}
