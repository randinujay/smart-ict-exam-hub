"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import Link from "next/link";

export default function StudentAreaError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Student area error", error);
  }, [error]);

  return (
    <div className="empty-state empty-state-large" role="alert">
      <h2>This page could not be loaded.</h2>
      <p>Something went wrong while loading your Smart ICT LMS data. Please try again.</p>
      <button className="button button-primary" onClick={() => reset()}>
        <RotateCcw size={16} /> Try again
      </button>
      <Link href="/app/support">Still stuck? Contact support</Link>
    </div>
  );
}
