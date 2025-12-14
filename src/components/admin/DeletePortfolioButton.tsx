"use client";

import { startTransition, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePortfolio } from "@/actions/portfolioActions";

export default function DeletePortfolioButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!confirm("정말로 이 포트폴리오를 삭제하시겠습니까? (복구 불가)")) return;

    startTransition(async () => {
      try {
        await deletePortfolio(id);
        toast.success("포트폴리오가 삭제되었습니다.");
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
