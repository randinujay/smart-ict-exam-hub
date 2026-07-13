"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { studentLoginAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";

export function StudentLoginForm() {
  const [state, action, pending] = useActionState(studentLoginAction, initialActionState);
  return (
    <form action={action} className="auth-form">
      <label className="field"><span>Mobile number</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0770123456" required /></label>
      <label className="field"><span>Password</span><input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
      {state.message && <p className={`form-message ${state.ok ? "success" : "error"}`}>{state.message}</p>}
      <button className="button button-primary button-full" disabled={pending}>{pending ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />} Sign in to Smart ICT</button>
    </form>
  );
}
