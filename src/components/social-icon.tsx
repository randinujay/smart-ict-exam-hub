import type { SVGProps } from "react";

type SocialIconName = "whatsapp" | "whatsapp-channel" | "facebook" | "youtube";

export function SocialIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: SocialIconName }) {
  if (name === "whatsapp") {
    return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><path d="M12.04 2a9.84 9.84 0 0 0-8.5 14.78L2 22l5.38-1.5A9.96 9.96 0 1 0 12.04 2Zm0 17.98a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.19.89.85-3.1-.2-.32a8.02 8.02 0 1 1 6.97 3.84Zm4.42-6.02c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2a7.25 7.25 0 0 1-1.34-1.67c-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.43-.59 1.63-1.15.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" /></svg>;
  }
  if (name === "whatsapp-channel") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M5 9v6"/><path d="M9 7.5v9"/><path d="M13 5v14"/><path d="M17 8v8"/><path d="M21 10v4"/></svg>;
  }
  if (name === "facebook") {
    return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><path d="M14 8.5V7c0-.73.48-.9.82-.9H17V2.64A29.7 29.7 0 0 0 14.15 2C11.33 2 9.4 3.72 9.4 6.88V8.5H6.2v3.86h3.2V22H14v-9.64h3.08l.5-3.86H14Z"/></svg>;
  }
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><path d="M23.5 6.19a3 3 0 0 0-2.11-2.12C19.53 3.57 12 3.57 12 3.57s-7.53 0-9.39.5A3 3 0 0 0 .5 6.19 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.81 3 3 0 0 0 2.11 2.12c1.86.5 9.39.5 9.39.5s7.53 0 9.39-.5a3 3 0 0 0 2.11-2.12A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z"/></svg>;
}
