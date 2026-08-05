"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";

export function useWorkspaceFeedback(pathname: string, renderSignal: ReactNode) {
  const [pendingHref, setPendingHref] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    setPendingHref("");
    setSubmitting(false);
    document.querySelectorAll<HTMLElement>("[data-submit-pending]").forEach((element) => {
      delete element.dataset.submitPending;
      element.removeAttribute("aria-disabled");
    });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(clear);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, renderSignal, clear]);
  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const scheduleFallback = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(clear, 5000);
  }, [clear]);

  const onClickCapture = useCallback((event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
    const target = new URL(anchor.href, window.location.href);
    if (target.origin !== window.location.origin || `${target.pathname}${target.search}` === `${window.location.pathname}${window.location.search}`) return;
    setPendingHref(`${target.pathname}${target.search}`);
    scheduleFallback();
  }, [scheduleFallback]);

  const onSubmitCapture = useCallback((event: FormEvent<HTMLElement>) => {
    const nativeEvent = event.nativeEvent as SubmitEvent;
    const submitter = nativeEvent.submitter;
    if (submitter instanceof HTMLButtonElement) {
      submitter.dataset.submitPending = "true";
      submitter.setAttribute("aria-disabled", "true");
    }
    setSubmitting(true);
    scheduleFallback();
  }, [scheduleFallback]);

  return {
    busy: Boolean(pendingHref) || submitting,
    pendingHref,
    onClickCapture,
    onSubmitCapture,
  };
}
