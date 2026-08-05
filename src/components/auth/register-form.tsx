"use client";

import { useActionState, useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { registerStudentAction } from "@/app/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { initialActionState } from "@/lib/action-state";

interface RegisterFormProps {
  programs: Array<{ id: string; name: string }>;
  academicBatches: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; programId: string; academicBatchId: string }>;
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  return message ? <small id={id} role="alert">{message}</small> : null;
}

export function RegisterForm({ programs, academicBatches, classes }: RegisterFormProps) {
  const [state, action, pending] = useActionState(registerStudentAction, initialActionState);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const savedClass = classes.find((item) => item.id === state.values?.batchId);
  const [selectedAcademicBatchId, setSelectedAcademicBatchId] = useState(String(state.values?.academicBatchId ?? savedClass?.academicBatchId ?? ""));
  const [selectedProgramId, setSelectedProgramId] = useState(String(state.values?.programId ?? ""));
  const availablePrograms = programs.filter((program) => classes.some((item) => item.academicBatchId === selectedAcademicBatchId && item.programId === program.id));
  const selectedClass = classes.find((item) => item.academicBatchId === selectedAcademicBatchId && item.programId === selectedProgramId);
  const error = (name: string) => clientErrors[name] ?? state.fieldErrors?.[name];
  const saved = state.values ?? {};
  const requiredLabel = (label: string) => <>{label}<span className="required-mark" aria-hidden="true"> *</span></>;

  const validate = (event: FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim();
    const errors: Record<string, string> = {};
    if (value("firstName").length < 2) errors.firstName = "Enter the first name.";
    if (value("lastName").length < 2) errors.lastName = "Enter the last name.";
    const birthDate = new Date(`${value("dateOfBirth")}T00:00:00`);
    if (!value("dateOfBirth") || Number.isNaN(birthDate.getTime()) || birthDate >= new Date()) errors.dateOfBirth = "Select a valid date of birth.";
    if (value("nic") && !/^(\d{9}[VXvx]|\d{12})$/.test(value("nic"))) errors.nic = "Enter a valid NIC or leave it blank.";
    if (!/^0(7[0-8])\d{7}$/.test(value("phone").replace(/[\s-]/g, ""))) errors.phone = "Use a valid 10-digit mobile number.";
    if (value("address").length < 5) errors.address = "Enter the address.";
    if (value("school").length < 2) errors.school = "Enter the school.";
    if (!['Sinhala', 'English'].includes(value("medium"))) errors.medium = "Select the medium.";
    if (!value("academicBatchId")) errors.academicBatchId = "Select a batch.";
    if (!value("programId")) errors.programId = "Select a program.";
    if (!value("batchId")) errors.batchId = "That class is not available.";
    if (value("password").length < 8) errors.password = "Use at least 8 characters.";
    if (value("password") !== value("confirmPassword")) errors.confirmPassword = "Passwords do not match.";
    if (Object.keys(errors).length) {
      event.preventDefault();
      setClientErrors(errors);
      const first = event.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(errors)[0]}"]`);
      first?.focus();
    }
  };

  const clearClientError = (event: FormEvent<HTMLFormElement>) => {
    const name = (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).name;
    if (name && clientErrors[name]) setClientErrors((current) => ({ ...current, [name]: "" }));
  };

  return <form action={action} className="auth-form registration-form" noValidate onSubmit={validate} onInput={clearClientError}>
    <div className="field-grid two-fields">
      <label className={`field ${error("firstName") ? "has-error" : ""}`}><span>{requiredLabel("First name")}</span><input name="firstName" autoComplete="given-name" defaultValue={saved.firstName} required aria-required="true" aria-invalid={Boolean(error("firstName"))} aria-describedby={error("firstName") ? "firstName-error" : undefined}/><ErrorText id="firstName-error" message={error("firstName")}/></label>
      <label className={`field ${error("lastName") ? "has-error" : ""}`}><span>{requiredLabel("Last name")}</span><input name="lastName" autoComplete="family-name" defaultValue={saved.lastName} required aria-required="true" aria-invalid={Boolean(error("lastName"))} aria-describedby={error("lastName") ? "lastName-error" : undefined}/><ErrorText id="lastName-error" message={error("lastName")}/></label>
    </div>
    <div className="field-grid two-fields">
      <label className={`field ${error("dateOfBirth") ? "has-error" : ""}`}><span>{requiredLabel("Date of birth")}</span><input name="dateOfBirth" type="date" autoComplete="bday" defaultValue={saved.dateOfBirth} max={new Date().toISOString().slice(0, 10)} required aria-required="true" aria-invalid={Boolean(error("dateOfBirth"))} aria-describedby={error("dateOfBirth") ? "dateOfBirth-error" : undefined}/><ErrorText id="dateOfBirth-error" message={error("dateOfBirth")}/></label>
      <label className={`field ${error("nic") ? "has-error" : ""}`}><span>NIC (Optional)</span><input name="nic" defaultValue={saved.nic} placeholder="200012345678 or 123456789V" autoCapitalize="characters" aria-invalid={Boolean(error("nic"))} aria-describedby={error("nic") ? "nic-error" : undefined}/><ErrorText id="nic-error" message={error("nic")}/></label>
    </div>
    <label className={`field ${error("phone") ? "has-error" : ""}`}><span>{requiredLabel("Contact number")}</span><input name="phone" type="tel" inputMode="numeric" autoComplete="tel" defaultValue={saved.phone} placeholder="0770123456" required aria-required="true" aria-invalid={Boolean(error("phone"))} aria-describedby={error("phone") ? "phone-error" : undefined}/><ErrorText id="phone-error" message={error("phone")}/></label>
    <label className={`field ${error("address") ? "has-error" : ""}`}><span>{requiredLabel("Address")}</span><textarea name="address" rows={3} autoComplete="street-address" defaultValue={saved.address} required aria-required="true" aria-invalid={Boolean(error("address"))} aria-describedby={error("address") ? "address-error" : undefined}/><ErrorText id="address-error" message={error("address")}/></label>
    <label className={`field ${error("school") ? "has-error" : ""}`}><span>{requiredLabel("School")}</span><input name="school" autoComplete="organization" defaultValue={saved.school} required aria-required="true" aria-invalid={Boolean(error("school"))} aria-describedby={error("school") ? "school-error" : undefined}/><ErrorText id="school-error" message={error("school")}/></label>
    <div className="field-grid two-fields">
      <label className={`field ${error("medium") ? "has-error" : ""}`}><span>{requiredLabel("Medium")}</span><select name="medium" defaultValue={saved.medium ?? ""} required aria-required="true" aria-invalid={Boolean(error("medium"))} aria-describedby={error("medium") ? "medium-error" : undefined}><option value="" disabled>Select medium</option><option value="Sinhala">Sinhala Medium</option><option value="English">English Medium</option></select><ErrorText id="medium-error" message={error("medium")}/></label>
      <label className={`field ${error("academicBatchId") ? "has-error" : ""}`}><span>{requiredLabel("Batch")}</span><select name="academicBatchId" value={selectedAcademicBatchId} onChange={(event) => { setSelectedAcademicBatchId(event.target.value); setSelectedProgramId(""); }} required disabled={!academicBatches.length} aria-required="true" aria-invalid={Boolean(error("academicBatchId"))} aria-describedby={error("academicBatchId") ? "academicBatchId-error" : undefined}><option value="" disabled>{academicBatches.length ? "Select your batch" : "No batches open"}</option>{academicBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select><ErrorText id="academicBatchId-error" message={error("academicBatchId")}/></label>
      <label className={`field ${error("programId") || error("batchId") ? "has-error" : ""}`}><span>{requiredLabel("Program")}</span><select name="programId" value={selectedProgramId} onChange={(event) => setSelectedProgramId(event.target.value)} required disabled={!selectedAcademicBatchId || !availablePrograms.length} aria-required="true" aria-invalid={Boolean(error("programId") || error("batchId"))} aria-describedby={error("programId") || error("batchId") ? "programId-error" : undefined}><option value="" disabled>{selectedAcademicBatchId ? "Select your program" : "Select a batch first"}</option>{availablePrograms.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select><ErrorText id="programId-error" message={error("programId") ?? error("batchId")}/></label>
    </div>
    <input type="hidden" name="batchId" value={selectedClass?.id ?? ""} />
    {(!programs.length || !classes.length || !academicBatches.length) && <p className="form-message error" role="alert">No classes are open for registration. Contact Smart ICT.</p>}
    <div className="field-grid two-fields">
      <PasswordInput name="password" label="Password" minLength={8} autoComplete="new-password" required showRequiredMark error={error("password")}/>
      <PasswordInput name="confirmPassword" label="Confirm password" minLength={8} autoComplete="new-password" required showRequiredMark error={error("confirmPassword")}/>
    </div>
    {state.message && <p className={`form-message ${state.ok ? "success" : "error"}`} role="status">{state.message}</p>}
    <button className="button button-primary button-full" disabled={pending || !programs.length || !classes.length || !academicBatches.length}>{pending ? <LoaderCircle className="spin" size={18}/> : <ArrowRight size={18}/>}Create account</button>
  </form>;
}
