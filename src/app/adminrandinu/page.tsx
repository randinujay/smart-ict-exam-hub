import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { Logo } from "@/components/logo";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
export const metadata:Metadata={title:"Teacher Administration",robots:{index:false,follow:false,nocache:true}};
export default function AdminLoginPage(){return <main className="admin-auth-page"><div className="admin-auth-brand"><Logo inverse/><div><LockKeyhole size={38}/><span className="section-kicker light">PRIVATE TEACHER ACCESS</span><h1>Smart ICT administration.</h1><p>Secure access for managing programs, students, monthly modules, assessments, marks and payments.</p></div><small>Authorised access for Randinu Jayaratne only.</small></div><section className="admin-auth-panel"><div><span className="section-kicker">TEACHER SIGN IN</span><h2>Open the workspace.</h2><p>This route is intentionally separate from the public student experience.</p><AdminLoginForm/></div></section></main>}
