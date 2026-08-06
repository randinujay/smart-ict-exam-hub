"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function AdminWorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin workspace error", error);
  }, [error]);

  return (
    <div className="empty-state empty-state-large" role="alert">
      <h2>This page could not be loaded.</h2>
      <p>Something went wrong loading this admin screen. Please try again.</p>
      <button className="button button-primary" onClick={() => reset()}>
        <RotateCcw size={16} /> Try again
      </button>
    </div>
  );
}
