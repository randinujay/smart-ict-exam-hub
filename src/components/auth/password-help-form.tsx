"use client";
import { useActionState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { initialActionState, requestPasswordHelpAction } from "@/app/actions/auth";
export function PasswordHelpForm(){const[state,action,pending]=useActionState(requestPasswordHelpAction,initialActionState);return <form action={action} className="auth-form"><label className="field"><span>Registered mobile number</span><input name="phone" type="tel" inputMode="tel" placeholder="0770123456" required /></label>{state.message&&<p className={`form-message ${state.ok?"success":"error"}`}>{state.message}</p>}<button className="button button-primary button-full" disabled={pending}>{pending?<LoaderCircle className="spin" size={18}/>:<Send size={18}/>}Request password help</button></form>}
