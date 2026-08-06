"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import type { ActionState } from "@/lib/action-state";
import { isValidSriLankanMobile, normalizeSriLankanPhone, studentEmailAlias } from "@/lib/auth";
import { dateOfBirthBounds, isValidDateOfBirth } from "@/lib/student-age";
import { resolveOpaqueId } from "@/lib/opaque-id";
import { getOpenRegistrationOptions } from "@/lib/registration-options";
import { createClient } from "@/lib/supabase/server";
import { callUserAdminFunction } from "@/lib/server/user-admin";

function required(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function studentLoginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const phone = required(formData, "phone");
  const password = required(formData, "password");
  if (!isValidSriLankanMobile(phone)) return { ok: false, message: "Enter a valid Sri Lankan mobile number." };
  if (password.length < 8) return { ok: false, message: "Password must contain at least 8 characters." };
  if (isDemoMode()) redirect("/app/dashboard?demo=1");
  if (!isSupabaseConfigured()) return { ok: false, message: "Student login is temporarily unavailable. Please contact Smart ICT." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: studentEmailAlias(phone), password });
  if (error) return { ok: false, message: "The phone number or password is incorrect." };
  redirect("/app/dashboard");
}

export async function registerStudentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const firstName = required(formData, "firstName");
  const lastName = required(formData, "lastName");
  const dateOfBirth = required(formData, "dateOfBirth");
  const nic = required(formData, "nic");
  const phone = required(formData, "phone");
  const address = required(formData, "address");
  const school = required(formData, "school");
  const medium = required(formData, "medium");
  const academicBatchId = required(formData, "academicBatchId");
  const programId = required(formData, "programId");
  const batchId = required(formData, "batchId");
  const password = required(formData, "password");
  const confirmPassword = required(formData, "confirmPassword");
  const values = { firstName, lastName, dateOfBirth, nic, phone, address, school, medium, academicBatchId, programId, batchId };

  const fieldErrors: Record<string, string> = {};
  if (firstName.length < 2) fieldErrors.firstName = "Enter the first name.";
  if (lastName.length < 2) fieldErrors.lastName = "Enter the last name.";
  if (!isValidDateOfBirth(dateOfBirth)) {
    const bounds = dateOfBirthBounds();
    fieldErrors.dateOfBirth = `Enter a date of birth between ${bounds.min} and ${bounds.max}.`;
  }
  if (nic && !/^(\d{9}[VXvx]|\d{12})$/.test(nic)) fieldErrors.nic = "Enter a valid NIC or leave it blank.";
  if (!isValidSriLankanMobile(phone)) fieldErrors.phone = "Use a valid 10-digit Sri Lankan mobile number.";
  if (address.length < 5) fieldErrors.address = "Enter the address.";
  if (school.length < 2) fieldErrors.school = "Enter the school.";
  if (!['Sinhala', 'English'].includes(medium)) fieldErrors.medium = "Select the medium.";
  if (!academicBatchId) fieldErrors.academicBatchId = "Select a batch.";
  if (!programId) fieldErrors.programId = "Select a program.";
  if (!batchId) fieldErrors.batchId = "Select a batch.";
  if (password.length < 8) fieldErrors.password = "Use at least 8 characters.";
  if (password !== confirmPassword) fieldErrors.confirmPassword = "Passwords do not match.";
  if (Object.keys(fieldErrors).length) return { ok: false, message: "Check the highlighted details.", fieldErrors, values };

  if (isDemoMode()) redirect("/app/dashboard?demo=1&registered=1");
  if (!isSupabaseConfigured()) return { ok: false, message: "Registration is temporarily unavailable. Please contact Smart ICT.", values };

  // The form submits opaque codes, not raw database IDs (see lib/opaque-id.ts) —
  // resolve them back against the same options a visitor could actually see on
  // /register right now, so a stale or tampered code fails cleanly instead of
  // silently mapping to the wrong program/class.
  const { programs: openPrograms, classes: openClasses } = await getOpenRegistrationOptions();
  const requestedProgram = resolveOpaqueId(openPrograms, programId);
  if (!requestedProgram) {
    return { ok: false, message: "That program is not open for registration.", fieldErrors: { programId: "Choose an open program." }, values };
  }
  const requestedBatch = resolveOpaqueId(openClasses, batchId);
  if (!requestedBatch || requestedBatch.programId !== requestedProgram.id) {
    return { ok: false, message: "That class is not open for registration.", fieldErrors: { batchId: "Choose a valid program for this batch." }, values };
  }

  const normalizedPhone = normalizeSriLankanPhone(phone);
  const alias = studentEmailAlias(normalizedPhone);
  const supabase = await createClient();
  // Re-check freshness at submit time (registration could have closed between
  // page load and submit) using the real, resolved IDs.
  const { data: freshProgram, error: programError } = await supabase
    .from("programs")
    .select("id,name")
    .eq("id", requestedProgram.id)
    .eq("is_active", true)
    .eq("registration_open", true)
    .maybeSingle();
  if (programError || !freshProgram) {
    return { ok: false, message: "That program is not open for registration.", fieldErrors: { programId: "Choose an open program." }, values };
  }
  const { data: freshBatch, error: batchError } = await supabase
    .from("batches")
    .select("id,name,academic_batches!inner(id)")
    .eq("id", requestedBatch.id)
    .eq("program_id", requestedProgram.id)
    .eq("is_active", true)
    .eq("registration_open", true)
    .eq("academic_batches.is_active", true)
    .maybeSingle();
  if (batchError || !freshBatch) {
    return { ok: false, message: "That class is not open for registration.", fieldErrors: { batchId: "Choose a valid program for this batch." }, values };
  }

  let createdUserId = "";
  try {
    const created = await callUserAdminFunction<{ userId: string }>("register_student", {
      phone: normalizedPhone,
      password,
      programId: requestedProgram.id,
      batchId: requestedBatch.id,
      metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        date_of_birth: dateOfBirth,
        nic: nic ? nic.toUpperCase() : null,
        address,
        school,
        medium,
        requested_program_id: requestedProgram.id,
        requested_batch_id: requestedBatch.id,
      },
    });
    createdUserId = created.userId;
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "We could not create the account. Please try again or contact support.", values };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email: alias, password });
  if (signInError) return { ok: false, message: "The account could not be activated. Please contact Smart ICT.", values };

  await supabase.from("support_requests").insert({
    student_id: createdUserId,
    contact_number: normalizedPhone,
    request_type: "account_verification",
    subject: "New student account verification",
    message: `${firstName} ${lastName} requested ${requestedBatch.name} - ${requestedProgram.name} Class and is awaiting manual review.`,
    status: "open",
  });

  redirect("/app/dashboard?registered=1");
}

export async function adminLoginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = required(formData, "email").toLowerCase();
  const password = required(formData, "password");
  if (!email || !password) return { ok: false, message: "Enter the teacher email and password." };
  if (isDemoMode()) redirect("/adminrandinu/dashboard?demo=1");
  if (!isSupabaseConfigured()) return { ok: false, message: "Administration login is temporarily unavailable." };
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || "randinujayaratne15@gmail.com").trim().toLowerCase();
  if (email !== configuredAdminEmail) return { ok: false, message: "Invalid teacher credentials." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, message: "Invalid teacher credentials." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { ok: false, message: "This account is not authorised for teacher administration." };
  }
  redirect("/adminrandinu/dashboard");
}

export async function requestPasswordHelpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const phone = required(formData, "phone");
  if (!isValidSriLankanMobile(phone)) return { ok: false, message: "Enter the mobile number used for registration." };
  if (isDemoMode()) return { ok: true, message: "Demo request recorded. In production this appears in the admin support queue." };
  if (!isSupabaseConfigured()) return { ok: false, message: "Password assistance is temporarily unavailable. Please use WhatsApp." };
  const supabase = await createClient();
  const { error } = await supabase.from("support_requests").insert({
    request_type: "password_reset",
    contact_number: normalizeSriLankanPhone(phone),
    subject: "Password reset assistance",
    message: "Student requested help resetting the LMS password.",
    status: "open",
  });
  return error ? { ok: false, message: "Could not submit the request. Please contact Smart ICT through WhatsApp." } : { ok: true, message: "Request submitted. Smart ICT will contact you." };
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function addNicAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const nic = required(formData, "nic").toUpperCase();
  if (!/^(\d{9}[VX]|\d{12})$/.test(nic)) return { ok: false, message: "Enter a valid Sri Lankan NIC number." };
  if (isDemoMode()) return { ok: true, message: "NIC saved in demo mode." };
  if (!isSupabaseConfigured()) return { ok: false, message: "Profile updates are temporarily unavailable." };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");
  const { data, error } = await supabase.rpc("add_my_nic", { p_nic: nic });
  if (error) return { ok: false, message: error.message || "Could not save the NIC. Contact support if the issue continues." };
  if (!data) return { ok: false, message: "The NIC is already locked. Contact support for corrections." };
  revalidatePath("/app/profile");
  return { ok: true, message: "NIC added successfully. It is now locked." };
}
