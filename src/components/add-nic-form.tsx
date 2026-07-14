"use client";

import { useActionState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { addNicAction } from "@/app/actions/auth";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { initialActionState } from "@/lib/action-state";

export function AddNicForm() {
  const [state, action, pending] = useActionState(addNicAction, initialActionState);
  return <form action={action} className="nic-add-form"><label className="field"><span>NIC</span><input name="nic" autoCapitalize="characters" placeholder="200012345678 or 123456789V" required aria-required="true"/></label>{state.message && <p className={`form-message ${state.ok ? "success" : "error"}`} role="status">{state.message}</p>}<ConfirmSubmitButton className="button button-primary" disabled={pending} message="Save this NIC permanently? You will not be able to edit it afterward.">{pending ? <LoaderCircle className="spin" size={18}/> : <LockKeyhole size={17}/>}Save and lock</ConfirmSubmitButton></form>;
}
