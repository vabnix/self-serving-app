"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

export default function DeleteResourceButton({ name }: { name: string }) {
  const [requested, setRequested] = useState(false);

  function handleClick() {
    if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
      setRequested(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={requested}
        className="btn btn-danger"
      >
        <Trash2 className="size-4" aria-hidden />
        Delete Resource
      </button>
      {requested && (
        <p role="status" className="basis-full text-sm text-zinc-600">
          Demo only: deletion is not connected yet, so nothing was deleted.
        </p>
      )}
    </>
  );
}
