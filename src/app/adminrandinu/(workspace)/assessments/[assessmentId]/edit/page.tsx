import { notFound } from "next/navigation";
import { AssessmentBuilder } from "@/components/admin/assessment-builder";
import { getAdminAssessment, getAdminData } from "@/lib/data";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";

export default async function EditAssessmentPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  if (!isDemoMode() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(assessmentId)) notFound();
  const [data, editorData] = await Promise.all([getAdminData(), getAdminAssessment(assessmentId)]);
  if (!editorData) notFound();
  return <AssessmentBuilder batches={data.batches} modules={data.modules} assessment={editorData.assessment} hasAttempts={editorData.hasAttempts} demoMode={!isSupabaseConfigured()} />;
}
