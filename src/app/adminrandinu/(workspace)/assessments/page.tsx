import Link from "next/link";
import { ClipboardCheck, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteAssessmentAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminData } from "@/lib/data";

export default async function AdminAssessmentsPage() {
  const data = await getAdminData();
  return <div>
    <PageHeading eyebrow="EXAMINATION SYSTEM" title="Exams & Quizzes" actions={<Link href="/adminrandinu/assessments/new" className="button button-primary"><Plus size={17} />Create assessment</Link>} />
    <section className="assessment-card-grid admin-assessment-grid">{data.assessments.map((assessment) => {
      const attempts = data.attempts.filter((attempt) => attempt.assessmentId === assessment.id).length;
      return <article key={assessment.id} className="assessment-card admin-manage-card">
        <div className="assessment-card-top"><span className="assessment-icon"><ClipboardCheck size={23} /></span><StatusBadge tone={assessment.status === "published" ? "success" : "neutral"}>{assessment.status}</StatusBadge></div>
        <div className="program-tags"><span>{assessment.delivery}</span><span>{assessment.timing}</span><span>{assessment.access}</span></div>
        <h3>{assessment.title}</h3>
        <div className="assessment-card-meta"><span>{assessment.questions.length} questions / {assessment.totalMarks} marks</span><span>{attempts} attempts</span></div>
        <div className="card-action-row"><Link href={`/adminrandinu/assessments/${assessment.id}/edit`} className="button button-outline button-small"><Pencil size={15} />Edit</Link><Link href={`/adminrandinu/assessments/${assessment.id}/attempts`} className="button button-outline button-small"><ListChecks size={15} />Attempts ({attempts})</Link><form action={deleteAssessmentAction}><input type="hidden" name="assessmentId" value={assessment.id} /><ConfirmSubmitButton className="button button-danger button-small" message={`Delete ${assessment.title}? Student attempts and results for this assessment will also be deleted.`}><Trash2 size={15} />Delete</ConfirmSubmitButton></form></div>
      </article>;
    })}</section>
  </div>;
}
