"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import type { ActionState } from "@/lib/action-state";
import { isValidSriLankanMobile, normalizeSriLankanPhone, studentEmailAlias } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
  const password = required(formData, "password");
  const confirmPassword = required(formData, "confirmPassword");

  const fieldErrors: Record<string, string> = {};
  if (firstName.length < 2) fieldErrors.firstName = "Enter the student’s first name.";
  if (lastName.length < 2) fieldErrors.lastName = "Enter the student’s last name.";
  const birthDate = dateOfBirth ? new Date(`${dateOfBirth}T00:00:00+05:30`) : null;
  if (!birthDate || Number.isNaN(birthDate.getTime()) || birthDate >= new Date()) fieldErrors.dateOfBirth = "Select a valid date of birth in the past.";
  if (nic && !/^(\d{9}[VXvx]|\d{12})$/.test(nic)) fieldErrors.nic = "Enter a valid Sri Lankan NIC number or leave it blank.";
  if (!isValidSriLankanMobile(phone)) fieldErrors.phone = "Use a valid Sri Lankan mobile number.";
  if (address.length < 5) fieldErrors.address = "Enter the student’s address.";
  if (school.length < 2) fieldErrors.school = "Enter the school name.";
  if (!['Sinhala', 'English'].includes(medium)) fieldErrors.medium = "Select the medium.";
  if (password.length < 8) fieldErrors.password = "Use at least 8 characters.";
  if (password !== confirmPassword) fieldErrors.confirmPassword = "Passwords do not match.";
  if (Object.keys(fieldErrors).length) return { ok: false, message: "Check the highlighted registration details.", fieldErrors };

  if (isDemoMode()) redirect("/app/dashboard?demo=1&registered=1");
  if (!isSupabaseConfigured()) return { ok: false, message: "Registration is temporarily unavailable. Please contact Smart ICT." };

  const normalizedPhone = normalizeSriLankanPhone(phone);
  const alias = studentEmailAlias(normalizedPhone);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: alias,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        contact_number: normalizedPhone,
        date_of_birth: dateOfBirth,
        nic: nic ? nic.toUpperCase() : null,
        address,
        school,
        medium,
        registration_source: "public_lms",
      },
    },
  });
  if (error || !data.user || data.user.identities?.length === 0) {
    const duplicate = data.user?.identities?.length === 0 || error?.message.toLowerCase().includes("already") || error?.message.toLowerCase().includes("registered");
    return { ok: false, message: duplicate ? "An account already exists for this mobile number." : "We could not create the account. Please try again or contact support." };
  }

  if (!data.session) {
    // Synthetic student emails cannot receive confirmation links. Avoid leaving
    // an unusable account when the Supabase project is misconfigured.
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, message: "Registration is temporarily unavailable. Smart ICT has been notified." };
  }

  // Registration itself is the verification request. The administrator sees both
  // the pending profile and this queue item without requiring another student step.
  await supabase.from("support_requests").insert({
    student_id: data.user.id,
    contact_number: normalizedPhone,
    request_type: "account_verification",
    subject: "New student account verification",
    message: `${firstName} ${lastName} created a Smart ICT LMS account and is awaiting manual review.`,
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
  return error ? { ok: false, message: "Could not submit the request. Please contact Smart ICT through WhatsApp." } : { ok: true, message: "Request submitted. Smart ICT will verify the account and contact you." };
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
