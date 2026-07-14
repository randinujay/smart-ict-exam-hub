import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = { title: "Teacher Administration", robots: { index: false, follow: false, nocache: true } };

export default function AdminLoginPage() {
  return <main className="admin-auth-page"><section className="admin-auth-panel"><Logo inverse/><span className="section-kicker light">PRIVATE TEACHER ACCESS</span><h1>Administration.</h1><AdminLoginForm/></section></main>;
}
