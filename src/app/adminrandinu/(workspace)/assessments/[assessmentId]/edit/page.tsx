import { notFound } from "next/navigation";
import { AssessmentBuilder } from "@/components/admin/assessment-builder";
import { getAdminData } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";

export default async function EditAssessmentPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  const data = await getAdminData();
  const assessment = data.assessments.find((item) => item.id === assessmentId);
  if (!assessment) notFound();
  const questionsLocked = data.attempts.some((attempt) => attempt.assessmentId === assessmentId);
  return <AssessmentBuilder batches={data.batches} modules={data.modules} students={data.students} assessment={assessment} questionsLocked={questionsLocked} demoMode={!isSupabaseConfigured()} />;
}
