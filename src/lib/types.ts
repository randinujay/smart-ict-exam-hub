export type Medium = "Sinhala" | "English";
export type AccountStatus = "pending" | "verified" | "suspended";
export type ContentAccess = "free" | "paid";
export type ModuleStatus = "draft" | "published" | "archived" | "upcoming";
export type AssessmentDelivery = "online" | "offline";
export type AssessmentTiming = "flexible" | "strict";
export type AssessmentSource = "smart_ict" | "school";
export type AssessmentStatus = "draft" | "published" | "closed" | "archived";
export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "short_answer" | "structured";

export interface Program {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  academicLevel: "O/L" | "A/L" | "Other";
  examYear: number | null;
  medium: Medium[];
  image: string;
  isPublic: boolean;
  registrationOpen: boolean;
  isActive: boolean;
}

export interface Batch {
  id: string;
  programId: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  nic?: string | null;
  address: string;
  school: string;
  medium: Medium;
  role: "student" | "admin";
  accountStatus: AccountStatus;
  requestedProgramId?: string | null;
  requestedBatchId?: string | null;
  requestedProgramStatus?: "none" | "pending" | "approved" | "rejected";
  createdAt: string;
  programIds: string[];
  batchIds: string[];
}

export interface Recording {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  videoUrl: string;
  publishedAt: string;
  access: ContentAccess;
  duration?: string;
  isPublished?: boolean;
}

export interface ResourceItem {
  id: string;
  moduleId?: string | null;
  title: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileType: "PDF" | "Worksheet" | "Past Paper" | "Tute" | "Image" | "Other";
  access: ContentAccess;
  publishedAt: string;
  programIds: string[];
  batchIds: string[];
  isUnlocked?: boolean;
  isPublished?: boolean;
}

export interface ModuleItem {
  id: string;
  programId: string;
  batchId?: string | null;
  title: string;
  month: number;
  year: number;
  access: ContentAccess;
  status: ModuleStatus;
  opensAt?: string | null;
  closesAt?: string | null;
  recordings: Recording[];
  resources: ResourceItem[];
  assessmentIds: string[];
  isUnlocked?: boolean;
}

export interface QuestionOption {
  id: string;
  key: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  marks: number;
  options?: QuestionOption[];
  correctAnswer?: string | string[];
  explanation?: string;
  imageUrl?: string | null;
}

export interface Assessment {
  id: string;
  moduleId?: string | null;
  title: string;
  description: string;
  instructions: string;
  delivery: AssessmentDelivery;
  timing: AssessmentTiming;
  source: AssessmentSource;
  status: AssessmentStatus;
  durationMinutes?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showAnswers: boolean;
  showResults: boolean;
  access: ContentAccess;
  totalMarks: number;
  questions: Question[];
  programIds: string[];
  batchIds: string[];
  studentIds: string[];
  isUnlocked?: boolean;
}

export interface ResultRecord {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  studentId: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  source: AssessmentSource;
  completedAt: string;
  status: "published" | "pending";
  mcqMarks?: number | null;
  structuredMarks?: number | null;
  feedback?: string | null;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  programId: string;
  batchId?: string | null;
  billingMonth: string;
  amount: number;
  status: "paid" | "unpaid" | "waived";
  paidAt?: string | null;
  notes?: string | null;
}

export interface Testimonial {
  id: string;
  studentName: string;
  programName: string;
  quote: string;
  resultLabel?: string;
  isPublished: boolean;
}

export interface DashboardData {
  student: StudentProfile;
  programs: Program[];
  modules: ModuleItem[];
  resources: ResourceItem[];
  assessments: Assessment[];
  results: ResultRecord[];
  payments: PaymentRecord[];
}

export interface SmartInsight {
  title: string;
  message: string;
  tone: "positive" | "neutral" | "attention";
}
