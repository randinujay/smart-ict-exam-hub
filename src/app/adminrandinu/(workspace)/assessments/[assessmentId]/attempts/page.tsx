import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deleteAttemptAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminData } from "@/lib/data";
import { isDemoMode } from "@/lib/env";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AssessmentAttemptsPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  if (!isDemoMode() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(assessmentId)) notFound();

  const data = await getAdminData();
  const assessment = data.assessments.find((item) => item.id === assessmentId);
  if (!assessment) notFound();

  const attempts = data.attempts.filter((attempt) => attempt.assessmentId === assessmentId);
  const students = new Map(data.students.map((student) => [student.id, student]));

  return <div>
    <Link href="/adminrandinu/assessments" className="back-link"><ArrowLeft size={16} />Back to quizzes</Link>
    <PageHeading eyebrow="QUIZ ATTEMPTS" title={assessment.title} />
    <section className="results-table-card admin-table-card">
      {attempts.length ? <div className="responsive-table"><table>
        <thead><tr><th>Attempt</th><th>Student</th><th>Started</th><th>Submitted</th><th>Status</th><th>Score</th><th>Actions</th></tr></thead>
        <tbody>{attempts.map((attempt) => {
          const student = students.get(attempt.studentId);
          const hasScore = attempt.score != null && attempt.maxScore != null;
          const tone = attempt.status === "graded" ? "success" : attempt.status === "in_progress" ? "brand" : attempt.status === "awaiting_manual" ? "warning" : "neutral";
          return <tr key={attempt.id}>
            <td>#{attempt.attemptNumber}</td>
            <td><div className="table-title-cell"><strong>{student?.fullName ?? "Student"}</strong><span>{student?.school ?? ""}</span></div></td>
            <td>{formatDate(attempt.startedAt)}</td>
            <td>{formatDate(attempt.submittedAt)}</td>
            <td><StatusBadge tone={tone}>{attempt.status.replaceAll("_", " ")}</StatusBadge></td>
            <td>{hasScore ? `${attempt.score} / ${attempt.maxScore}${attempt.percentage != null ? ` (${Math.round(attempt.percentage)}%)` : ""}` : "—"}</td>
            <td><form action={deleteAttemptAction}>
              <input type="hidden" name="attemptId" value={attempt.id} />
              <input type="hidden" name="assessmentId" value={assessmentId} />
              <ConfirmSubmitButton className="icon-danger-button" aria-label={`Delete attempt ${attempt.attemptNumber} by ${student?.fullName ?? "student"}`} message="Delete this attempt, its saved answers and its linked result? The student may be able to take the quiz again."><Trash2 size={16} /></ConfirmSubmitButton>
            </form></td>
          </tr>;
        })}</tbody>
      </table></div> : <div className="empty-state">No attempts recorded for this quiz.</div>}
    </section>
  </div>;
}
