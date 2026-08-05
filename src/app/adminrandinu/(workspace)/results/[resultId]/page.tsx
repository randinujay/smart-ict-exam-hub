import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { publishManualResultAction, updateResultAction } from "@/app/actions/admin";
import { PageHeading } from "@/components/page-heading";
import { getManualReview } from "@/lib/data";

function answerText(value: string | string[] | null) { return Array.isArray(value) ? value.join(", ") : value || "No answer submitted"; }

export default async function ResultEditorPage({ params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = await params;
  const review = await getManualReview(resultId);
  if (!review) notFound();
  const needsManualMarking = review.result.status === "pending" && review.answers.some((answer) => answer.type === "structured");
  return <div>
    <Link href="/adminrandinu/results" className="back-link"><ArrowLeft size={16} />Back to results</Link>
    <PageHeading eyebrow={needsManualMarking ? "MANUAL MARKING" : "RESULT EDITOR"} title={review.assessment.title} description={review.student.fullName} />
    {needsManualMarking ? <form action={publishManualResultAction} className="manual-review-form"><input type="hidden" name="resultId" value={resultId} />
      {review.answers.map((answer, index) => <article key={answer.answerId} className="manual-answer-card"><div className="manual-answer-heading"><div><span>Question {index + 1}</span><h2>{answer.prompt}</h2></div><label><small>Marks / {answer.maximumMarks}</small><input name={`mark_${answer.answerId}`} type="number" min="0" max={answer.maximumMarks} step="0.5" defaultValue={answer.awardedMarks ?? 0} /></label></div><div className="submitted-answer"><strong>Student answer</strong><p>{answerText(answer.submittedAnswer)}</p></div>{answer.markingGuidance && <div className="marking-guidance"><CheckCircle2 size={18} /><div><strong>Marking guidance</strong><p>{answer.markingGuidance}</p></div></div>}</article>)}
      <section className="admin-card"><label className="field"><span>Teacher feedback</span><textarea name="feedback" rows={5} defaultValue={review.result.feedback ?? ""} /></label><button className="button button-primary"><Save size={17} />Publish result</button></section>
    </form> : <section className="admin-card result-editor-card"><form action={updateResultAction} className="admin-form-grid"><input type="hidden" name="resultId" value={resultId} /><label className="field"><span>Obtained marks</span><input name="obtainedMarks" type="number" min="0" step="0.5" defaultValue={review.result.obtainedMarks} required /></label><label className="field"><span>Total marks</span><input name="totalMarks" type="number" min="0.5" step="0.5" defaultValue={review.result.totalMarks} required /></label><label className="field"><span>Status</span><select name="status" defaultValue={review.result.status}><option value="pending">Pending</option><option value="published">Published</option></select></label><label className="field full"><span>Feedback</span><textarea name="feedback" rows={5} defaultValue={review.result.feedback ?? ""} /></label><button className="button button-primary"><Save size={17} />Save result</button></form></section>}
  </div>;
}
