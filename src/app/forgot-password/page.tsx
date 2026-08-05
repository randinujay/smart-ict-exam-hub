import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { PasswordHelpForm } from "@/components/auth/password-help-form";

export const metadata: Metadata = { title: "Password Help", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return <main className="simple-auth-page"><div className="simple-auth-card"><Logo/><span className="section-kicker">PASSWORD HELP</span><h1>Recover your account.</h1><PasswordHelpForm/><Link href="/login" className="auth-back-inline">← Return to sign in</Link></div></main>;
}
