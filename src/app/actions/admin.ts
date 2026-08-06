"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isValidSriLankanMobile, normalizeSriLankanPhone } from "@/lib/auth";
import { callUserAdminFunction } from "@/lib/server/user-admin";

async function requireAdmin() {
  if (isDemoMode()) return null;
  if (!isSupabaseConfigured()) throw new Error("Supabase configuration is missing.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/adminrandinu");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");
  return supabase;
}

async function countReferences(
  supabase: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>,
  table: string,
  column: string,
  matchValue: string,
) {
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).eq(column, matchValue);
  return count ?? 0;
}

function value(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }
function bool(formData: FormData, key: string) { return formData.get(key) === "on" || formData.get(key) === "true"; }
function colomboLocalToIso(input: string) {
  if (!input) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) throw new Error("Enter a valid Sri Lankan date and time.");
  const parsed = new Date(`${input}:00+05:30`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Enter a valid Sri Lankan date and time.");
  return parsed.toISOString();
}
function requireChoice(input: string, allowed: readonly string[], label: string) {
  if (!allowed.includes(input)) throw new Error(`Select a valid ${label}.`);
  return input;
}
function requireWebUrl(input: string, label: string, allowLocalPath = false) {
  if (allowLocalPath && input.startsWith("/")) return input;
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
    return parsed.toString();
  } catch {
    throw new Error(`Enter a valid ${label} URL.`);
  }
}

type AdminClient = NonNullable<Awaited<ReturnType<typeof requireAdmin>>>;

async function requireClassSelection(supabase: AdminClient, formData: FormData) {
  const programId = value(formData, "programId");
  const batchId = value(formData, "batchId");
  if (!programId || !batchId) throw new Error("Select a batch and program.");
  const { data, error } = await supabase
    .from("batches")
    .select("id,academic_batch_id")
    .eq("id", batchId)
    .eq("program_id", programId)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) throw new Error("Select an available class.");
  return { programId, batchId };
}

export async function changeAdminPasswordAction(formData: FormData) {
  const supabase = await requireAdmin();
  if (!supabase) return;

  const currentPassword = value(formData, "currentPassword");
  const newPassword = value(formData, "newPassword");
  const confirmPassword = value(formData, "confirmPassword");
  if (newPassword.length < 10) redirect("/adminrandinu/settings?password=weak");
  if (newPassword !== confirmPassword) redirect("/adminrandinu/settings?password=mismatch");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect("/adminrandinu/settings?password=error");
  const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (reauthError) redirect("/adminrandinu/settings?password=invalid-current");

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) redirect("/adminrandinu/settings?password=error");
  redirect("/adminrandinu/settings?password=changed");
}

export async function createProgramAction(formData: FormData) {
  const supabase = await requireAdmin();
  if (!supabase) return;
  const name=value(formData,"name");const shortName=value(formData,"shortName");
  if(name.length<3||shortName.length<2)throw new Error("Enter a valid program name and short name.");
  const { error } = await supabase.from("programs").insert({
    name,
    short_name: shortName,
    slug: value(formData, "slug").toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    description: value(formData, "description"),
    academic_level: "Other",
    exam_year: null,
    mediums: ["Sinhala", "English"],
    cover_image_url: "/ol-theory-poster.jpg",
    is_public: true,
    registration_open: true,
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/programs"); revalidatePath("/programs"); revalidatePath("/register"); revalidatePath("/");
}

export async function createBatchAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const academicBatchId = value(formData, "academicBatchId");
  const programId = value(formData, "programId");
  const { data: academicBatch, error: batchReadError } = await supabase.from("academic_batches").select("name").eq("id", academicBatchId).eq("is_active", true).single();
  if (batchReadError || !academicBatch) throw new Error("Select an active batch.");
  const { error } = await supabase.from("batches").insert({
    academic_batch_id: academicBatchId, program_id: programId, name: academicBatch.name,
    description: value(formData,"description") || null, is_active: true,
    registration_open: bool(formData, "registrationOpen"),
  });
  if (error) throw new Error(error.message); revalidatePath("/adminrandinu/batches");
}

export async function createAcademicBatchAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const examYear = Number(value(formData, "examYear"));
  const academicLevel = requireChoice(value(formData, "academicLevel"), ["O/L", "A/L", "Other"], "academic level");
  if (!Number.isInteger(examYear) || examYear < 2026 || examYear > 2200) throw new Error("Enter a valid exam year.");
  const name = `${examYear} ${academicLevel}`;
  const { error } = await supabase.from("academic_batches").insert({ name, exam_year: examYear, academic_level: academicLevel, is_active: true });
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/batches"); revalidatePath("/register");
}

export async function createModuleAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { programId, batchId } = await requireClassSelection(supabase, formData);
  const month = Number(value(formData,"month")); const year = Number(value(formData,"year"));
  if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(year)||year<2020||year>2200)throw new Error("Select a valid module month and year.");
  const access=requireChoice(value(formData,"access"),["free","paid"],"access type");
  const status=requireChoice(value(formData,"status"),["draft","published","upcoming","archived"],"module status");
  const { error } = await supabase.from("modules").insert({
    program_id: programId, batch_id: batchId,
    title: value(formData,"title") || new Intl.DateTimeFormat("en",{month:"long",year:"numeric"}).format(new Date(year,month-1,1)),
    month, year, access_type: access, status,
    opens_at: colomboLocalToIso(value(formData,"opensAt")), closes_at: colomboLocalToIso(value(formData,"closesAt")),
  });
  if (error) throw new Error(error.message); revalidatePath("/adminrandinu/modules"); revalidatePath("/app/modules");
}

export async function createRecordingAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const title=value(formData,"title");if(title.length<2)throw new Error("Enter a recording title.");
  const videoUrl=requireWebUrl(value(formData,"videoUrl"),"recording");
  const access=requireChoice(value(formData,"access"),["free","paid"],"access type");
  const { error } = await supabase.from("recordings").insert({ module_id:value(formData,"moduleId"), title, description:value(formData,"description"), video_url:videoUrl, duration_label:value(formData,"duration"), access_type:access, is_published:bool(formData,"isPublished") });
  if(error) throw new Error(error.message); revalidatePath("/adminrandinu/recordings"); revalidatePath("/app/modules");
}

export async function updateStudentStatusAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const studentId=value(formData,"studentId"); const accountStatus=requireChoice(value(formData,"accountStatus"),["pending","verified","suspended"],"account status");
  const { error }=await supabase.from("profiles").update({account_status:accountStatus,verified_at:accountStatus==="verified"?new Date().toISOString():null}).eq("id",studentId).eq("role","student");
  if(error) throw new Error(error.message); revalidatePath("/adminrandinu/students");
}

export async function assignStudentAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const studentId=value(formData,"studentId"); const { programId, batchId } = await requireClassSelection(supabase, formData);
  const { error }=await supabase.from("enrollments").upsert({student_id:studentId,program_id:programId,batch_id:batchId,status:"active"},{onConflict:"student_id,program_id,batch_id"});
  if(error) throw new Error(error.message); revalidatePath("/adminrandinu/students");
}

export async function reviewStudentProgramRequestAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const studentId = value(formData, "studentId");
  const decision = requireChoice(value(formData, "decision"), ["approve", "reject"], "review decision");
  const programId = value(formData, "programId") || null;
  const batchId = value(formData, "batchId") || null;
  if (decision === "approve") await requireClassSelection(supabase, formData);
  const { error } = await supabase.rpc("review_student_program_request", {
    p_student_id: studentId,
    p_decision: decision,
    p_program_id: programId,
    p_batch_id: batchId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/dashboard");
  revalidatePath("/adminrandinu/students");
  revalidatePath(`/adminrandinu/students/${studentId}`);
  revalidatePath("/adminrandinu/support");
  revalidatePath("/app");
}

export async function markPaymentAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { programId, batchId } = await requireClassSelection(supabase, formData);
  const billingMonth=value(formData,"billingMonth");const amount=Number(value(formData,"amount")||0);
  const status=requireChoice(value(formData,"status"),["paid","unpaid","waived"],"payment status");
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(billingMonth)||!Number.isFinite(amount)||amount<0)throw new Error("Enter a valid billing month and amount.");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/adminrandinu");
  const { error }=await supabase.from("payments").upsert({
    student_id:value(formData,"studentId"), program_id:programId, batch_id:batchId,
    billing_month:`${billingMonth}-01`, amount, status,
    paid_at:status==="paid"?new Date().toISOString():null, notes:value(formData,"notes")||null, recorded_by:user.id,
  },{onConflict:"student_id,program_id,batch_id,billing_month"});
  if(error) throw new Error(error.message); revalidatePath("/adminrandinu/payments"); revalidatePath("/app/payments");
}

export async function createTestimonialAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const {error}=await supabase.from("testimonials").insert({student_name:value(formData,"studentName"),program_name:value(formData,"programName"),quote:value(formData,"quote"),result_label:value(formData,"resultLabel")||null,is_published:bool(formData,"isPublished")});
  if(error) throw new Error(error.message); revalidatePath("/adminrandinu/testimonials"); revalidatePath("/results"); revalidatePath("/");
}

export async function updateSiteSettingsAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const publicKeys = new Set(["whatsapp_channel_url", "facebook_url", "youtube_url"]);
  const entries=["bank_name","bank_branch","bank_account_name","bank_account_number","whatsapp_channel_url","facebook_url","youtube_url"].map((key)=>{const raw=value(formData,key);return{content_key:key,content_value:publicKeys.has(key)&&raw?requireWebUrl(raw,key.replaceAll("_"," ")):raw,content_type:"setting",is_public:publicKeys.has(key)}});
  const{error}=await supabase.from("site_content").upsert(entries,{onConflict:"content_key"}); if(error)throw new Error(error.message); revalidatePath("/"); revalidatePath("/app/payments");
}

export async function updateSupportStatusAction(formData: FormData) {
  const supabase=await requireAdmin();if(!supabase)return;const status=requireChoice(value(formData,"status"),["open","in_progress","resolved","closed"],"support status");const{error}=await supabase.from("support_requests").update({status,admin_notes:value(formData,"adminNotes")||null}).eq("id",value(formData,"requestId"));if(error)throw new Error(error.message);revalidatePath("/adminrandinu/support");
}

export async function publishManualResultAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const resultId=value(formData,"resultId");
  const marks:Record<string,number>={};
  for(const [key,raw] of formData.entries()){
    if(key.startsWith("mark_")) marks[key.slice(5)]=Number(raw||0);
  }
  const {error}=await supabase.rpc("publish_manual_result",{p_result_id:resultId,p_marks:marks,p_feedback:value(formData,"feedback")||null});
  if(error) throw new Error(error.message);
  revalidatePath("/adminrandinu/results");
  revalidatePath(`/adminrandinu/results/${resultId}`);
  revalidatePath("/app/results");
  redirect("/adminrandinu/results");
}


export async function updateStudentDetailsAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const studentId=value(formData,"studentId");
  const phone=value(formData,"phone");
  if(!isValidSriLankanMobile(phone)) throw new Error("Enter a valid Sri Lankan mobile number.");
  const normalized=normalizeSriLankanPhone(phone);
  const nic=value(formData,"nic").toUpperCase();
  if(nic && !/^(\d{9}[VX]|\d{12})$/.test(nic)) throw new Error("Enter a valid Sri Lankan NIC number or leave it blank.");
  const updates={
    first_name:value(formData,"firstName"),last_name:value(formData,"lastName"),
    date_of_birth:value(formData,"dateOfBirth"),nic:nic||null,
    contact_number:normalized,address:value(formData,"address"),school:value(formData,"school"),medium:requireChoice(value(formData,"medium"),["Sinhala","English"],"medium"),
  };
  const {data:existing,error:existingError}=await supabase.from("profiles").select("contact_number,first_name,last_name").eq("id",studentId).eq("role","student").single();
  if(existingError||!existing) throw new Error("Student account not found.");
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) redirect("/adminrandinu");
  await callUserAdminFunction("update_student_login",{studentId,phone:normalized,firstName:updates.first_name,lastName:updates.last_name},session.access_token);
  const {error}=await supabase.from("profiles").update(updates).eq("id",studentId).eq("role","student");
  if(error){
    if(existing.contact_number){
      await callUserAdminFunction("update_student_login",{studentId,phone:existing.contact_number,firstName:existing.first_name,lastName:existing.last_name},session.access_token);
    }
    throw new Error(error.message);
  }
  revalidatePath("/adminrandinu/students");revalidatePath(`/adminrandinu/students/${studentId}`);
  redirect("/adminrandinu/students");
}

export async function resetStudentPasswordAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const studentId=value(formData,"studentId");const temporaryPassword=value(formData,"temporaryPassword");
  if(temporaryPassword.length<8) throw new Error("Temporary password must contain at least 8 characters.");
  const {data:student,error:studentError}=await supabase.from("profiles").select("id").eq("id",studentId).eq("role","student").single();
  if(studentError||!student) throw new Error("Student account not found.");
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) redirect("/adminrandinu");
  await callUserAdminFunction("reset_student_password",{studentId,password:temporaryPassword},session.access_token);
  revalidatePath(`/adminrandinu/students/${studentId}`);
}

export async function setStudentAccessOverrideAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const studentId=value(formData,"studentId");
  const [contentType,contentId]=value(formData,"content").split(":",2);
  requireChoice(contentType,["module","recording","resource","assessment"],"content type");
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(contentId||""))throw new Error("Select valid content.");
  const decision=requireChoice(value(formData,"decision"),["allow","deny"],"access decision");
  const expiresAt=value(formData,"expiresAt");
  if(expiresAt&&Number.isNaN(Date.parse(expiresAt)))throw new Error("Enter a valid expiry date and time.");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/adminrandinu");
  const {error}=await supabase.from("access_overrides").upsert({
    student_id:studentId,content_type:contentType,content_id:contentId,is_allowed:decision==="allow",
    reason:value(formData,"reason")||null,expires_at:colomboLocalToIso(expiresAt),created_by:user.id,
  },{onConflict:"student_id,content_type,content_id"});
  if(error)throw new Error(error.message);
  revalidatePath(`/adminrandinu/students/${studentId}`);
  revalidatePath("/app");
}

export async function updateProgramAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const programId = value(formData, "programId");
  const { error } = await supabase.from("programs").update({
    name: value(formData, "name"), short_name: value(formData, "shortName"),
    slug: value(formData, "slug").toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    description: value(formData, "description"),
    academic_level: "Other", exam_year: null, mediums: ["Sinhala", "English"],
    is_public: true, registration_open: true, is_active: bool(formData, "isActive"),
  }).eq("id", programId);
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/programs"); revalidatePath("/programs"); revalidatePath("/register"); revalidatePath("/");
}

export async function deleteProgramAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { error } = await supabase.from("programs").delete().eq("id", value(formData, "programId"));
  if (error) throw new Error(`This program still has linked records. Remove its modules, payments and assignments first. ${error.message}`);
  revalidatePath("/adminrandinu/programs"); revalidatePath("/programs"); revalidatePath("/register"); revalidatePath("/");
}

export async function updateBatchAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const academicBatchId = value(formData, "academicBatchId");
  const { data: academicBatch, error: batchReadError } = await supabase.from("academic_batches").select("name").eq("id", academicBatchId).single();
  if (batchReadError || !academicBatch) throw new Error("Select a valid batch.");
  const { error } = await supabase.from("batches").update({
    academic_batch_id: academicBatchId, program_id: value(formData, "programId"), name: academicBatch.name,
    description: value(formData, "description") || null, is_active: bool(formData, "isActive"),
    registration_open: bool(formData, "registrationOpen"),
  }).eq("id", value(formData, "batchId"));
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/batches"); revalidatePath("/adminrandinu/students");
}

export async function updateAcademicBatchAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const examYear = Number(value(formData, "examYear"));
  const academicLevel = requireChoice(value(formData, "academicLevel"), ["O/L", "A/L", "Other"], "academic level");
  if (!Number.isInteger(examYear) || examYear < 2026 || examYear > 2200) throw new Error("Enter a valid exam year.");
  const batchId = value(formData, "academicBatchId");
  const name = `${examYear} ${academicLevel}`;
  const { error } = await supabase.from("academic_batches").update({ name, exam_year: examYear, academic_level: academicLevel, is_active: bool(formData, "isActive") }).eq("id", batchId);
  if (error) throw new Error(error.message);
  await supabase.from("batches").update({ name }).eq("academic_batch_id", batchId);
  revalidatePath("/adminrandinu/batches"); revalidatePath("/register"); revalidatePath("/");
}

export async function deleteAcademicBatchAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const academicBatchId = value(formData, "academicBatchId");

  const classCount = await countReferences(supabase, "batches", "academic_batch_id", academicBatchId);
  if (classCount > 0) {
    redirect(`/adminrandinu/batches?error=${encodeURIComponent(
      `Cannot delete this batch: it still has ${classCount} ${classCount === 1 ? "class" : "classes"} under it. Remove or reassign ${classCount === 1 ? "it" : "them"} first.`,
    )}`);
  }

  const { error } = await supabase.from("academic_batches").delete().eq("id", academicBatchId);
  if (error) {
    console.error("deleteAcademicBatchAction failed", error);
    redirect(`/adminrandinu/batches?error=${encodeURIComponent("This batch could not be deleted. It may still be referenced elsewhere.")}`);
  }
  revalidatePath("/adminrandinu/batches"); revalidatePath("/register");
}

export async function deleteBatchAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const batchId = value(formData, "batchId");

  const [enrollmentCount, moduleCount, paymentCount] = await Promise.all([
    countReferences(supabase, "enrollments", "batch_id", batchId),
    countReferences(supabase, "modules", "batch_id", batchId),
    countReferences(supabase, "payments", "batch_id", batchId),
  ]);
  const blockers: string[] = [];
  if (enrollmentCount > 0) blockers.push(`${enrollmentCount} enrolled student${enrollmentCount === 1 ? "" : "s"}`);
  if (moduleCount > 0) blockers.push(`${moduleCount} module${moduleCount === 1 ? "" : "s"}`);
  if (paymentCount > 0) blockers.push(`${paymentCount} payment record${paymentCount === 1 ? "" : "s"}`);
  if (blockers.length) {
    redirect(`/adminrandinu/batches?error=${encodeURIComponent(
      `Cannot delete this class: it still has ${blockers.join(", ")}. Remove or reassign these first.`,
    )}`);
  }

  const { error } = await supabase.from("batches").delete().eq("id", batchId);
  if (error) {
    console.error("deleteBatchAction failed", error);
    redirect(`/adminrandinu/batches?error=${encodeURIComponent("This class could not be deleted. It may still be in use.")}`);
  }
  revalidatePath("/adminrandinu/batches");
}

export async function updateModuleAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { programId, batchId } = await requireClassSelection(supabase, formData);
  const month = Number(value(formData, "month")); const year = Number(value(formData, "year"));
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) throw new Error("Select a valid month and year.");
  const { error } = await supabase.from("modules").update({
    program_id: programId, batch_id: batchId,
    title: value(formData, "title"), month, year,
    access_type: requireChoice(value(formData, "access"), ["free", "paid"], "access type"),
    status: requireChoice(value(formData, "status"), ["draft", "published", "upcoming", "archived"], "module status"),
    opens_at: colomboLocalToIso(value(formData, "opensAt")), closes_at: colomboLocalToIso(value(formData, "closesAt")),
  }).eq("id", value(formData, "moduleId"));
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/modules"); revalidatePath("/app/modules");
}

export async function deleteModuleAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const moduleId = value(formData, "moduleId");
  const { count } = await supabase.from("assessments").select("id", { count: "exact", head: true }).eq("module_id", moduleId);
  if (count) throw new Error("Move or delete the assessments in this module before deleting it.");
  const { error } = await supabase.from("modules").delete().eq("id", moduleId);
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/modules"); revalidatePath("/app/modules");
}

export async function updateRecordingAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { error } = await supabase.from("recordings").update({
    module_id: value(formData, "moduleId"), title: value(formData, "title"),
    description: value(formData, "description") || null,
    video_url: requireWebUrl(value(formData, "videoUrl"), "recording"), duration_label: value(formData, "duration") || null,
    access_type: requireChoice(value(formData, "access"), ["free", "paid"], "access type"), is_published: bool(formData, "isPublished"),
  }).eq("id", value(formData, "recordingId"));
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/recordings"); revalidatePath("/app/modules");
}

export async function deleteRecordingAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { error } = await supabase.from("recordings").delete().eq("id", value(formData, "recordingId"));
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/recordings"); revalidatePath("/app/modules");
}

export async function updateResourceAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const resourceId = value(formData, "resourceId");
  const access = requireChoice(value(formData, "access"), ["free", "paid"], "access type");
  const moduleId = value(formData, "moduleId") || null;
  if (access === "paid" && !moduleId) throw new Error("Paid resources must belong to a module.");
  const { error } = await supabase.from("resources").update({
    module_id: moduleId, title: value(formData, "title"), description: value(formData, "description") || null,
    file_type: value(formData, "fileType") || "Other", access_type: access, is_published: bool(formData, "isPublished"),
  }).eq("id", resourceId);
  if (error) throw new Error(error.message);
  const { error: audienceDeleteError } = await supabase.from("content_audiences").delete().eq("content_type", "resource").eq("content_id", resourceId);
  if (audienceDeleteError) throw new Error(audienceDeleteError.message);
  const audiences = formData.getAll("batchIds").map(String).filter(Boolean).map((batchId) => ({ content_type: "resource", content_id: resourceId, batch_id: batchId }));
  if (audiences.length) {
    const { error: audienceError } = await supabase.from("content_audiences").insert(audiences);
    if (audienceError) throw new Error(audienceError.message);
  }
  revalidatePath("/adminrandinu/resources"); revalidatePath("/app/resources");
}

export async function deleteResourceAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const resourceId = value(formData, "resourceId");
  const { data: resource, error: readError } = await supabase.from("resources").select("storage_path").eq("id", resourceId).single();
  if (readError) throw new Error(readError.message);
  const { error } = await supabase.from("resources").delete().eq("id", resourceId);
  if (error) throw new Error(error.message);
  if (resource?.storage_path) await supabase.storage.from("resources").remove([resource.storage_path]);
  revalidatePath("/adminrandinu/resources"); revalidatePath("/app/resources");
}

export async function updatePaymentAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { programId, batchId } = await requireClassSelection(supabase, formData);
  const billingMonth = value(formData, "billingMonth"); const amount = Number(value(formData, "amount") || 0);
  const status = requireChoice(value(formData, "status"), ["paid", "unpaid", "waived"], "payment status");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(billingMonth) || !Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid month and amount.");
  const { error } = await supabase.from("payments").update({
    program_id: programId, batch_id: batchId,
    billing_month: `${billingMonth}-01`, amount, status, paid_at: status === "paid" ? new Date().toISOString() : null,
    notes: value(formData, "notes") || null,
  }).eq("id", value(formData, "paymentId"));
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/payments"); revalidatePath("/app/payments");
}

export async function deletePaymentAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { error } = await supabase.from("payments").delete().eq("id", value(formData, "paymentId"));
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/payments"); revalidatePath("/app/payments");
}

export async function updateTestimonialAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { error } = await supabase.from("testimonials").update({
    student_name: value(formData, "studentName"), program_name: value(formData, "programName"),
    quote: value(formData, "quote"), result_label: value(formData, "resultLabel") || null,
    is_published: bool(formData, "isPublished"),
  }).eq("id", value(formData, "testimonialId"));
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/testimonials"); revalidatePath("/");
}

export async function deleteTestimonialAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { error } = await supabase.from("testimonials").delete().eq("id", value(formData, "testimonialId"));
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/testimonials"); revalidatePath("/");
}

export async function updateHomepageContentAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const keys = [
    "hero_eyebrow", "hero_title", "hero_highlight", "hero_description", "hero_image_url",
    "programs_kicker", "programs_title", "programs_description",
    "about_kicker", "about_title", "about_lead", "about_body", "about_image_url",
    "why_kicker", "why_title", "why_description",
    "lms_kicker", "lms_title", "lms_description",
    "reviews_kicker", "reviews_title", "reviews_description",
    "faq_kicker", "faq_title", "faq_description",
    "contact_kicker", "contact_title",
  ];
  const entries = keys.map((key) => {
    const raw = value(formData, key);
    return { content_key: key, content_value: key.endsWith("_image_url") && raw ? requireWebUrl(raw, key.replaceAll("_", " "), true) : raw, content_type: key.endsWith("_image_url") ? "image" : "text", is_public: true };
  });
  const { error } = await supabase.from("site_content").upsert(entries, { onConflict: "content_key" });
  if (error) throw new Error(error.message);
  revalidatePath("/"); revalidatePath("/adminrandinu/homepage");
}

export async function deleteSupportRequestAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { error } = await supabase.from("support_requests").delete().eq("id", value(formData, "requestId"));
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/support");
}

export async function updateResultAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const obtainedMarks = Number(value(formData, "obtainedMarks")); const totalMarks = Number(value(formData, "totalMarks"));
  if (!Number.isFinite(obtainedMarks) || !Number.isFinite(totalMarks) || totalMarks <= 0 || obtainedMarks < 0 || obtainedMarks > totalMarks) throw new Error("Enter valid marks.");
  const { error } = await supabase.rpc("update_result_admin", {
    p_result_id: value(formData, "resultId"), p_obtained_marks: obtainedMarks, p_total_marks: totalMarks,
    p_feedback: value(formData, "feedback") || null,
    p_status: requireChoice(value(formData, "status"), ["pending", "published"], "result status"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/results"); revalidatePath("/app/results");
  redirect("/adminrandinu/results");
}

export async function deleteResultAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { error } = await supabase.rpc("delete_result_admin", { p_result_id: value(formData, "resultId") });
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/results"); revalidatePath("/app/results");
}

export async function deleteAssessmentAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { error } = await supabase.from("assessments").delete().eq("id", value(formData, "assessmentId"));
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/assessments"); revalidatePath("/adminrandinu/results"); revalidatePath("/app/assessments");
}

export async function deleteAttemptAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const attemptId = value(formData, "attemptId");
  const assessmentId = value(formData, "assessmentId");
  const { error } = await supabase.rpc("delete_attempt_admin", { p_attempt_id: attemptId });
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/assessments");
  revalidatePath(`/adminrandinu/assessments/${assessmentId}/attempts`);
  revalidatePath(`/adminrandinu/assessments/${assessmentId}/edit`);
  revalidatePath("/adminrandinu/results");
  revalidatePath("/app/assessments");
  revalidatePath("/app/results");
}

export async function unassignStudentAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const query = supabase.from("enrollments").delete().eq("student_id", value(formData, "studentId")).eq("program_id", value(formData, "programId"));
  const batchId = value(formData, "batchId");
  const { error } = batchId ? await query.eq("batch_id", batchId) : await query;
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/students"); revalidatePath(`/adminrandinu/students/${value(formData, "studentId")}`);
}

export async function deleteStudentAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const studentId = value(formData, "studentId");
  const { data: student, error: studentError } = await supabase.from("profiles").select("id").eq("id", studentId).eq("role", "student").single();
  if (studentError || !student) throw new Error("Student account not found.");
  await supabase.from("support_requests").delete().eq("student_id", studentId);
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) redirect("/adminrandinu");
  await callUserAdminFunction("delete_student",{studentId},session.access_token);
  revalidatePath("/adminrandinu/students"); revalidatePath("/adminrandinu/results");
  redirect("/adminrandinu/students");
}
