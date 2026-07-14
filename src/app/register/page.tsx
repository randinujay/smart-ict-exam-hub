import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { RegisterForm } from "@/components/auth/register-form";
import { getPublicPrograms } from "@/lib/data";

export const metadata: Metadata = { title: "Create Student Account", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const programs = (await getPublicPrograms()).filter((program) => program.registrationOpen);
  return <main className="registration-page"><div className="registration-shell"><header className="registration-header"><Logo/><div className="registration-signin"><span>Already registered?</span><Link href="/login" className="button button-outline button-small">Sign in</Link></div></header><section><div className="registration-intro"><div><span className="section-kicker">CREATE YOUR LMS ACCOUNT</span><h1>Start learning with Smart ICT.</h1></div><div className="registration-status-flow" aria-label="Registration steps"><span><b>1</b><strong>Register</strong></span><span><b>2</b><strong>Enter the LMS</strong></span><span><b>3</b><strong>Get verified</strong></span></div></div><div className="registration-card"><RegisterForm programs={programs.map(({ id, name }) => ({ id, name }))}/></div></section></div></main>;
}
