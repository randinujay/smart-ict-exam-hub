"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/actions/auth";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createSupportRequestAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const requestType = value(formData, "requestType");
  const subject = value(formData, "subject");
  const message = value(formData, "message");
  if (!requestType || subject.length < 3 || message.length < 10) {
    return { ok: false, message: "Add a subject and a clear description of the issue." };
  }
  if (isDemoMode()) return { ok: true, message: "Demo support request submitted successfully." };
  if (!isSupabaseConfigured()) return { ok: false, message: "Support is temporarily unavailable. Please use WhatsApp." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("support_requests").insert({
    student_id: user.id,
    request_type: requestType,
    subject,
    message,
    status: "open",
  });
  if (error) return { ok: false, message: "Could not submit the request. Use WhatsApp if the issue is urgent." };
  revalidatePath("/app/support");
  return { ok: true, message: "Support request submitted. Smart ICT will review it." };
}
