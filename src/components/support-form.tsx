"use client";

import { useActionState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { createSupportRequestAction } from "@/app/actions/student";
import { initialActionState } from "@/lib/action-state";

export function SupportForm() {
  const [state, action, pending] = useActionState(createSupportRequestAction, initialActionState);
  return <form action={action} className="support-form"><label className="field"><span>Category</span><select name="requestType" required aria-required="true" defaultValue=""><option value="" disabled>Select category</option><option value="account">Account verification</option><option value="access">Content access</option><option value="payment">Payment</option><option value="result">Assessment or result</option><option value="profile_correction">Profile correction</option><option value="technical">Technical issue</option><option value="other">Other</option></select></label><label className="field"><span>Subject</span><input name="subject" minLength={3} required aria-required="true"/></label><label className="field"><span>Message</span><textarea name="message" rows={6} minLength={10} required aria-required="true"/></label>{state.message && <p className={`form-message ${state.ok ? "success" : "error"}`} role="status">{state.message}</p>}<button className="button button-primary" disabled={pending}>{pending ? <LoaderCircle className="spin" size={18}/> : <Send size={17}/>}Submit request</button></form>;
}
