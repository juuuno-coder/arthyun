"use client";

import { useTransition } from "react";
import { deleteExhibition } from "@/actions/exhibitionActions";
import { Button } from "@/components/ui/button";

export default function DeleteExhibitionButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm("정말로 이 전시를 삭제하시겠습니까? 복구할 수 없습니다.")) {
            startTransition(async () => {
                await deleteExhibition(id);
            });
        }
    };

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-500 hover:bg-red-600 text-white"
        >
            {isPending ? "삭제 중..." : "삭제"}
        </Button>
    );
}
