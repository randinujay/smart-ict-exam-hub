"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { adminLoginAction } from "@/app/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { initialActionState } from "@/lib/action-state";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, initialActionState);
  return <form action={action} className="auth-form"><label className="field"><span>Teacher email</span><input name="email" type="email" autoComplete="email" required /></label><PasswordInput name="password" label="Password" autoComplete="current-password" minLength={8} required />{state.message && <p className="form-message error" role="alert">{state.message}</p>}<button className="button button-primary button-full" disabled={pending}>{pending ? <LoaderCircle className="spin" size={18}/> : <ShieldCheck size={18}/>}Open workspace<ArrowRight size={17}/></button></form>;
}
