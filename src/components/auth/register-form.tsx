"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { registerStudentAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerStudentAction, initialActionState);
  const error = (name: string) => state.fieldErrors?.[name];
  return (
    <form action={action} className="auth-form registration-form">
      <div className="field-grid two-fields">
        <label className={`field ${error("firstName") ? "has-error" : ""}`}><span>First name</span><input name="firstName" autoComplete="given-name" required />{error("firstName") && <small>{error("firstName")}</small>}</label>
        <label className={`field ${error("lastName") ? "has-error" : ""}`}><span>Last name</span><input name="lastName" autoComplete="family-name" required />{error("lastName") && <small>{error("lastName")}</small>}</label>
      </div>
      <div className="field-grid two-fields">
        <label className={`field ${error("dateOfBirth") ? "has-error" : ""}`}><span>Date of birth</span><input name="dateOfBirth" type="date" required />{error("dateOfBirth") && <small>{error("dateOfBirth")}</small>}</label>
        <label className="field"><span>NIC <em>Optional</em></span><input name="nic" placeholder="Add now or once later" autoCapitalize="characters" /></label>
      </div>
      <label className={`field ${error("phone") ? "has-error" : ""}`}><span>Contact number</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0770123456" required />{error("phone") && <small>{error("phone")}</small>}</label>
      <label className={`field ${error("address") ? "has-error" : ""}`}><span>Address</span><textarea name="address" rows={3} autoComplete="street-address" required />{error("address") && <small>{error("address")}</small>}</label>
      <label className={`field ${error("school") ? "has-error" : ""}`}><span>School</span><input name="school" required />{error("school") && <small>{error("school")}</small>}</label>
      <label className={`field ${error("medium") ? "has-error" : ""}`}><span>Medium</span><select name="medium" defaultValue="" required><option value="" disabled>Select medium</option><option value="Sinhala">Sinhala Medium</option><option value="English">English Medium</option></select>{error("medium") && <small>{error("medium")}</small>}</label>
      <div className="field-grid two-fields">
        <label className={`field ${error("password") ? "has-error" : ""}`}><span>Create password</span><input name="password" type="password" minLength={8} autoComplete="new-password" required />{error("password") && <small>{error("password")}</small>}</label>
        <label className={`field ${error("confirmPassword") ? "has-error" : ""}`}><span>Confirm password</span><input name="confirmPassword" type="password" minLength={8} autoComplete="new-password" required />{error("confirmPassword") && <small>{error("confirmPassword")}</small>}</label>
      </div>
      {state.message && <p className={`form-message ${state.ok ? "success" : "error"}`}>{state.message}</p>}
      <p className="form-note">After registration, you can use free LMS content immediately. Paid content unlocks after manual account verification and payment confirmation.</p>
      <button className="button button-primary button-full" disabled={pending}>{pending ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />} Create Smart ICT account</button>
    </form>
  );
}
