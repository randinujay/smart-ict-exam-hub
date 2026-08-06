"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled page error", error);
  }, [error]);

  return (
    <div className="site-shell">
      <div className="empty-state empty-state-large" role="alert">
        <h2>Something went wrong.</h2>
        <p>This page could not load. Please try again, or contact Smart ICT through WhatsApp if it keeps happening.</p>
        <button className="button button-primary" onClick={() => reset()}>
          <RotateCcw size={16} /> Try again
        </button>
      </div>
    </div>
  );
}
