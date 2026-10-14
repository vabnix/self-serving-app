"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteResource } from "@/app/actions";

export default function DeleteResourceButton({
  id,
  name,
  deleting,
}: {
  id: string;
  name: string;
  deleting: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteResource(id);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || deleting}
        className="btn btn-danger"
      >
        <Trash2 className="size-4" aria-hidden />
        {pending || deleting ? "Deleting…" : "Delete Resource"}
      </button>
      {error && (
        <p role="alert" className="basis-full text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
