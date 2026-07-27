import { cache } from "react";
import { redirect } from "next/navigation";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  demoAssessments,
  demoBatches,
  demoDashboardData,
  demoModules,
  demoPayments,
  demoPrograms,
  demoResources,
  demoResults,
  demoStudent,
  demoStudents,
  demoTestimonials,
} from "@/lib/demo-data";
import type {
  Assessment,
  Batch,
  DashboardData,
  ModuleItem,
  PaymentRecord,
  Program,
  ResourceItem,
  ResultRecord,
  StudentProfile,
  Testimonial,
} from "@/lib/types";

function mapProgram(row: Record<string, unknown>): Program {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    shortName: String(row.short_name ?? row.name),
    description: String(row.description ?? ""),
    academicLevel: (row.academic_level as Program["academicLevel"]) ?? "Other",
    examYear: row.exam_year ? Number(row.exam_year) : null,
    medium: (row.mediums as Program["medium"]) ?? ["Sinhala", "English"],
    image: String(row.cover_image_url ?? "/ol-theory-poster.jpg"),
    isPublic: Boolean(row.is_public),
    registrationOpen: Boolean(row.registration_open),
    isActive: Boolean(row.is_active),
  };
}

export const getPublicPrograms = cache(async (): Promise<Program[]> => {
  if (isDemoMode()) return demoPrograms;
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("is_public", true)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) {
    console.error("public programs query failed", error);
    return [];
  }
  return data.map((row) => mapProgram(row));
});

export const getPublicBatches = cache(async (): Promise<Batch[]> => {
  if (isDemoMode()) return demoBatches.filter((batch) => batch.isActive);
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("batches")
    .select("id,program_id,name,description,is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error || !data) {
    console.error("public batches query failed", error);
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    programId: row.program_id,
    name: row.name,
    description: row.description ?? undefined,
    isActive: row.is_active,
  }));
});

export const getProgramBySlug = cache(async (slug: string): Promise<Program | null> => {
  const programs = await getPublicPrograms();
  return programs.find((program) => program.slug === slug) ?? null;
});

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  if (isDemoMode()) return demoTestimonials;
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error || !data) {
    console.error("public testimonials query failed", error);
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    studentName: row.student_name,
    programName: row.program_name,
    quote: row.quote,
    resultLabel: row.result_label,
    isPublished: row.is_published,
  }));
});

export const getCurrentStudent = cache(async (): Promise<StudentProfile> => {
  if (isDemoMode()) return demoStudent;
  if (!isSupabaseConfigured()) throw new Error("Supabase configuration is missing.");
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");
  const { data, error } = await supabase.rpc("get_my_profile");
  if (error || !data) redirect("/login");
  return data as StudentProfile;
});

export const getStudentDashboardData = cache(async (): Promise<DashboardData> => {
  if (isDemoMode()) return demoDashboardData;
  if (!isSupabaseConfigured()) throw new Error("Supabase configuration is missing.");
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");
  const { data, error } = await supabase.rpc("get_student_dashboard");
  if (error || !data) {
    console.error("get_student_dashboard failed", error);
    throw new Error("The student dashboard could not be loaded.");
  }
  return data as DashboardData;
});

export const getAssessmentForStudent = cache(async (assessmentId: string): Promise<Assessment | null> => {
  if (isDemoMode()) {
    return demoAssessments.find((assessment) => assessment.id === assessmentId) ?? null;
  }
  if (!isSupabaseConfigured()) throw new Error("Supabase configuration is missing.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_assessment_for_student", {
    p_assessment_id: assessmentId,
  });
  if (error || !data) return null;
  return data as Assessment;
});

export const getResultForStudent = cache(async (resultId: string): Promise<ResultRecord | null> => {
  if (isDemoMode()) return demoResults.find((result) => result.id === resultId) ?? null;
  if (!isSupabaseConfigured()) throw new Error("Supabase configuration is missing.");
  const dashboard = await getStudentDashboardData();
  return dashboard.results.find((result) => result.id === resultId) ?? null;
});

export interface AdminData {
  programs: Program[];
  batches: Batch[];
  students: StudentProfile[];
  modules: ModuleItem[];
  resources: ResourceItem[];
  assessments: Assessment[];
  attempts: Array<{
    id: string;
    assessmentId: string;
    studentId: string;
    status: "in_progress" | "submitted" | "awaiting_manual" | "graded";
    startedAt: string;
    deadlineAt?: string | null;
    submittedAt?: string | null;
    autoSubmitted: boolean;
  }>;
  results: ResultRecord[];
  payments: PaymentRecord[];
  testimonials: Testimonial[];
}

export interface AdminDashboardSummary {
  stats: {
    students: number;
    verified: number;
    pending: number;
    publishedModules: number;
    programs: number;
    paidThisMonth: number;
  };
  pendingStudents: Array<{
    id: string;
    fullName: string;
    initials: string;
    school: string;
    medium: string;
    createdAt: string;
  }>;
  recentResults: Array<{
    id: string;
    assessmentTitle: string;
    studentName: string;
    percentage: number;
    completedAt: string;
  }>;
}

export const getAdminDashboardSummary = cache(async (): Promise<AdminDashboardSummary> => {
  if (isDemoMode()) {
    const pendingStudents = demoStudents.filter((student) => student.accountStatus === "pending");
    return {
      stats: {
        students: demoStudents.length,
        verified: demoStudents.filter((student) => student.accountStatus === "verified").length,
        pending: pendingStudents.length,
        publishedModules: demoModules.filter((module) => module.status === "published").length,
        programs: demoPrograms.filter((program) => program.isActive).length,
        paidThisMonth: demoPayments.filter((payment) => ["paid", "waived"].includes(payment.status)).length,
      },
      pendingStudents: pendingStudents.slice(0, 5).map((student) => ({
        id: student.id,
        fullName: student.fullName,
        initials: `${student.firstName[0]}${student.lastName[0]}`.toUpperCase(),
        school: student.school,
        medium: student.medium,
        createdAt: student.createdAt,
      })),
      recentResults: [...demoResults].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).slice(0, 5).map((result) => ({
        id: result.id,
        assessmentTitle: result.assessmentTitle,
        studentName: demoStudents.find((student) => student.id === result.studentId)?.fullName ?? "Student",
        percentage: result.percentage,
        completedAt: result.completedAt,
      })),
    };
  }
  if (!isSupabaseConfigured()) throw new Error("Supabase configuration is missing.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_dashboard_summary");
  if (error || !data) {
    console.error("get_admin_dashboard_summary failed", error);
    throw new Error("The administration dashboard could not be loaded.");
  }
  return data as AdminDashboardSummary;
});

export const getAdminData = cache(async (): Promise<AdminData> => {
  if (isDemoMode()) {
    return {
      programs: demoPrograms,
      batches: demoBatches,
      students: demoStudents,
      modules: demoModules,
      resources: demoResources,
      assessments: demoAssessments,
      attempts: [],
      results: demoResults,
      payments: demoPayments,
      testimonials: demoTestimonials,
    };
  }
  if (!isSupabaseConfigured()) throw new Error("Supabase configuration is missing.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_workspace");
  if (error || !data) {
    console.error("get_admin_workspace failed", error);
    throw new Error("The administration workspace could not be loaded.");
  }
  return data as AdminData;
});

export interface SupportRequestRecord {
  id: string;
  studentId?: string | null;
  contactNumber?: string | null;
  requestType: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  adminNotes?: string | null;
  createdAt: string;
}

export const getAdminSupportRequests = cache(async (): Promise<SupportRequestRecord[]> => {
  if (isDemoMode()) return [
    { id: "support-demo-1", studentId: "student-demo-002", requestType: "account", subject: "Account verification", message: "Please review my newly created account.", status: "open", createdAt: "2026-07-11T09:00:00.000Z" },
    { id: "support-demo-2", studentId: "student-demo-001", requestType: "payment", subject: "July payment access", message: "I sent the receipt through WhatsApp but the July module is still locked.", status: "in_progress", createdAt: "2026-07-10T14:30:00.000Z" },
  ];
  if (!isSupabaseConfigured()) throw new Error("Supabase configuration is missing.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("support_requests").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({ id: row.id, studentId: row.student_id, contactNumber: row.contact_number, requestType: row.request_type, subject: row.subject, message: row.message, status: row.status, adminNotes: row.admin_notes, createdAt: row.created_at }));
});

export const getSiteSettings = cache(async (): Promise<Record<string, string>> => {
  if (!isSupabaseConfigured()) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_content").select("content_key,content_value").eq("content_type", "setting");
  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.content_key, row.content_value ?? ""]));
});

export const getPublicSiteContent = cache(async (): Promise<Record<string, string>> => {
  if (!isSupabaseConfigured()) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("content_key,content_value")
    .eq("is_public", true);
  if (error || !data) {
    console.error("public site content query failed", error);
    return {};
  }
  return Object.fromEntries(data.map((row) => [row.content_key, row.content_value ?? ""]));
});


export interface ManualReviewData {
  result: ResultRecord;
  student: { id: string; fullName: string; phone: string; school: string };
  assessment: { id: string; title: string; totalMarks: number };
  answers: Array<{
    answerId: string;
    questionId: string;
    prompt: string;
    type: string;
    maximumMarks: number;
    submittedAnswer: string | string[] | null;
    awardedMarks: number | null;
    markingGuidance?: string | null;
    isCorrect?: boolean | null;
  }>;
}

export const getManualReview = cache(async (resultId: string): Promise<ManualReviewData | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_manual_review", { p_result_id: resultId });
  if (error || !data) return null;
  return data as ManualReviewData;
});
