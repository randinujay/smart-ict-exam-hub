import type { Assessment, ModuleItem, PaymentRecord, StudentProfile } from "@/lib/types";

export function hasPaidModuleAccess(
  student: StudentProfile,
  module: ModuleItem,
  payments: PaymentRecord[],
) {
  if (typeof module.isUnlocked === "boolean") return module.isUnlocked;
  if (module.access === "free") return true;
  if (student.accountStatus !== "verified") return false;
  if (!student.programIds.includes(module.programId)) return false;
  if (module.batchId && !student.batchIds.includes(module.batchId)) return false;

  const billingMonth = `${module.year}-${String(module.month).padStart(2, "0")}`;
  return payments.some(
    (payment) =>
      payment.studentId === student.id &&
      payment.programId === module.programId &&
      payment.billingMonth.startsWith(billingMonth) &&
      (payment.status === "paid" || payment.status === "waived"),
  );
}

export function canOpenAssessment(
  student: StudentProfile,
  assessment: Assessment,
  module: ModuleItem | undefined,
  payments: PaymentRecord[],
) {
  if (typeof assessment.isUnlocked === "boolean") return assessment.isUnlocked;
  if (student.accountStatus === "suspended") return false;
  if (assessment.access === "free") return true;
  if (assessment.studentIds.includes(student.id)) return true;
  const audienceMatch =
    assessment.programIds.some((id) => student.programIds.includes(id)) ||
    assessment.batchIds.some((id) => student.batchIds.includes(id));
  if (!audienceMatch) return false;
  if (!module) return student.accountStatus === "verified";
  return hasPaidModuleAccess(student, module, payments);
}
