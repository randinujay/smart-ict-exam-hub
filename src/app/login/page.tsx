import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { StudentLoginForm } from "@/components/auth/student-login-form";

export const metadata: Metadata = { title: "Student Login", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <main className="auth-page auth-page-simple"><section className="auth-panel"><div className="auth-panel-inner"><Logo/><span className="section-kicker">STUDENT SIGN IN</span><h1>Welcome back.</h1><StudentLoginForm/><div className="auth-links"><Link href="/forgot-password">Forgot password?</Link><span>New here? <Link href="/register">Create account</Link></span></div><Link href="/" className="auth-back-inline">← Back to public website</Link></div></section></main>;
}
