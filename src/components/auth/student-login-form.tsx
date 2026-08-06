"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { studentLoginAction } from "@/app/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { initialActionState } from "@/lib/action-state";
import { LOCAL_MOBILE_PATTERN, sanitizePhoneInput } from "@/lib/auth";

export function StudentLoginForm() {
  const [state, action, pending] = useActionState(studentLoginAction, initialActionState);
  return <form action={action} className="auth-form"><label className="field"><span>Mobile number</span><input name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="0770123456" pattern={LOCAL_MOBILE_PATTERN} required aria-required="true" onInput={(event) => { event.currentTarget.value = sanitizePhoneInput(event.currentTarget.value); }} /></label><PasswordInput name="password" label="Password" autoComplete="current-password" minLength={8} required />{state.message && <p className={`form-message ${state.ok ? "success" : "error"}`} role="status">{state.message}</p>}<button className="button button-primary button-full" disabled={pending}>{pending ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}Sign in</button></form>;
}
