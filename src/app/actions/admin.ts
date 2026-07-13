"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidSriLankanMobile, normalizeSriLankanPhone, studentEmailAlias } from "@/lib/auth";

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

export async function createProgramAction(formData: FormData) {
  const supabase = await requireAdmin();
  if (!supabase) return;
  const mediums = formData.getAll("mediums").map(String);
  const name=value(formData,"name");const shortName=value(formData,"shortName");
  const academicLevel=requireChoice(value(formData,"academicLevel"),["O/L","A/L","Other"],"academic level");
  const examYear=value(formData,"examYear")?Number(value(formData,"examYear")):null;
  if(name.length<3||shortName.length<2)throw new Error("Enter a valid program name and short name.");
  if(!mediums.length||mediums.some((item)=>!["Sinhala","English"].includes(item)))throw new Error("Select at least one valid medium.");
  if(examYear!==null&&(!Number.isInteger(examYear)||examYear<2026||examYear>2100))throw new Error("Enter a valid exam year.");
  const coverImage=value(formData,"coverImage")||"/ol-theory-poster.jpg";
  const { error } = await supabase.from("programs").insert({
    name,
    short_name: shortName,
    slug: value(formData, "slug").toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    description: value(formData, "description"),
    academic_level: academicLevel,
    exam_year: examYear,
    mediums,
    cover_image_url: requireWebUrl(coverImage,"cover image",true),
    is_public: bool(formData, "isPublic"),
    registration_open: bool(formData, "registrationOpen"),
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/adminrandinu/programs"); revalidatePath("/programs"); revalidatePath("/");
}

export async function createBatchAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const { error } = await supabase.from("batches").insert({ program_id: value(formData,"programId"), name: value(formData,"name"), description: value(formData,"description"), is_active: true });
  if (error) throw new Error(error.message); revalidatePath("/adminrandinu/batches");
}

export async function createModuleAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const month = Number(value(formData,"month")); const year = Number(value(formData,"year"));
  if(!Number.isInteger(month)||month<1||month>12||!Number.isInteger(year)||year<2020||year>2200)throw new Error("Select a valid module month and year.");
  const access=requireChoice(value(formData,"access"),["free","paid"],"access type");
  const status=requireChoice(value(formData,"status"),["draft","published","upcoming","archived"],"module status");
  const { error } = await supabase.from("modules").insert({
    program_id: value(formData,"programId"), batch_id: value(formData,"batchId") || null,
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
  const studentId=value(formData,"studentId"); const programId=value(formData,"programId"); const batchId=value(formData,"batchId")||null;
  const { error }=await supabase.from("enrollments").upsert({student_id:studentId,program_id:programId,batch_id:batchId,status:"active"},{onConflict:"student_id,program_id,batch_id"});
  if(error) throw new Error(error.message); revalidatePath("/adminrandinu/students");
}

export async function markPaymentAction(formData: FormData) {
  const supabase = await requireAdmin(); if (!supabase) return;
  const billingMonth=value(formData,"billingMonth");const amount=Number(value(formData,"amount")||0);
  const status=requireChoice(value(formData,"status"),["paid","unpaid","waived"],"payment status");
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(billingMonth)||!Number.isFinite(amount)||amount<0)throw new Error("Enter a valid billing month and amount.");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/adminrandinu");
  const { error }=await supabase.from("payments").upsert({
    student_id:value(formData,"studentId"), program_id:value(formData,"programId"), batch_id:value(formData,"batchId")||null,
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
  const {data:existing,error:existingError}=await supabase.from("profiles").select("contact_number").eq("id",studentId).eq("role","student").single();
  if(existingError||!existing) throw new Error("Student account not found.");
  const admin=createAdminClient();
  const {error:authError}=await admin.auth.admin.updateUserById(studentId,{email:studentEmailAlias(normalized),email_confirm:true,user_metadata:{first_name:updates.first_name,last_name:updates.last_name,contact_number:normalized}});
  if(authError) throw new Error(`Login phone update failed: ${authError.message}`);
  const {error}=await supabase.from("profiles").update(updates).eq("id",studentId).eq("role","student");
  if(error){
    if(existing.contact_number){
      await admin.auth.admin.updateUserById(studentId,{email:studentEmailAlias(existing.contact_number),email_confirm:true});
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
  const admin=createAdminClient();
  const {error}=await admin.auth.admin.updateUserById(studentId,{password:temporaryPassword});
  if(error) throw new Error(error.message);
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
