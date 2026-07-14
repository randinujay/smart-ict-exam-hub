import Link from "next/link";
import { ArrowRight, FileUp, Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { deleteResultAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { OfflineResultsImporter } from "@/components/admin/offline-results-importer";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminData } from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import type { ResultRecord, StudentProfile } from "@/lib/types";

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function studentResults(results: ResultRecord[], studentId: string) {
  return results.filter((item) => item.studentId === studentId).sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
}

function eligibleForAssessment(student: StudentProfile, assessment: { programIds: string[]; batchIds: string[]; studentIds: string[] }) {
  if (student.accountStatus === "suspended") return false;
  if (!assessment.programIds.length && !assessment.batchIds.length && !assessment.studentIds.length) return true;
  return assessment.studentIds.includes(student.id)
    || assessment.programIds.some((id) => student.programIds.includes(id))
    || assessment.batchIds.some((id) => student.batchIds.includes(id));
}

export default async function AdminResultsPage() {
  const data = await getAdminData();
  const published = data.results.filter((item) => item.status === "published");
  const ordered = [...data.results].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  const onlineAssessmentIds = new Set(data.assessments.filter((item) => item.delivery === "online").map((item) => item.id));
  const offlineAssessmentIds = new Set(data.assessments.filter((item) => item.delivery === "offline").map((item) => item.id));
  const onlineResults = published.filter((item) => onlineAssessmentIds.has(item.assessmentId));
  const offlineResults = published.filter((item) => offlineAssessmentIds.has(item.assessmentId));

  const studentPerformance = data.students.map((student) => {
    const records = studentResults(published, student.id);
    const recent = records.slice(-3);
    return {
      student,
      count: records.length,
      average: average(records.map((item) => item.percentage)),
      trend: recent.length >= 2 ? recent.at(-1)!.percentage - recent[0].percentage : 0,
    };
  }).filter((item) => item.count > 0);
  const rankings = [...studentPerformance].sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
  const improving = [...studentPerformance].filter((item) => item.trend > 0).sort((a, b) => b.trend - a.trend).slice(0, 5);
  const declining = [...studentPerformance].filter((item) => item.trend < 0).sort((a, b) => a.trend - b.trend).slice(0, 5);

  const programAverages = data.programs.map((program) => {
    const studentIds = new Set(data.students.filter((student) => student.programIds.includes(program.id)).map((student) => student.id));
    const records = published.filter((result) => studentIds.has(result.studentId));
    return { label: program.shortName, students: studentIds.size, results: records.length, average: average(records.map((item) => item.percentage)) };
  });
  const batchAverages = data.batches.map((batch) => {
    const studentIds = new Set(data.students.filter((student) => student.batchIds.includes(batch.id)).map((student) => student.id));
    const records = published.filter((result) => studentIds.has(result.studentId));
    return { label: batch.name, students: studentIds.size, results: records.length, average: average(records.map((item) => item.percentage)) };
  });

  const distribution = [
    { label: "80–100%", count: published.filter((item) => item.percentage >= 80).length },
    { label: "60–79%", count: published.filter((item) => item.percentage >= 60 && item.percentage < 80).length },
    { label: "40–59%", count: published.filter((item) => item.percentage >= 40 && item.percentage < 60).length },
    { label: "Below 40%", count: published.filter((item) => item.percentage < 40).length },
  ];

  const participation = data.assessments.map((assessment) => {
    const eligible = data.students.filter((student) => eligibleForAssessment(student, assessment));
    const completedIds = new Set(data.results.filter((result) => result.assessmentId === assessment.id).map((result) => result.studentId));
    const startedIds = new Set(data.attempts.filter((attempt) => attempt.assessmentId === assessment.id).map((attempt) => attempt.studentId));
    const unsubmitted = eligible.filter((student) => startedIds.has(student.id) && !completedIds.has(student.id));
    return {
      assessment,
      eligible: eligible.length,
      completed: eligible.filter((student) => completedIds.has(student.id)).length,
      unsubmitted,
    };
  });

  const paidPayments = data.payments.filter((item) => item.status === "paid");
  const mcqAverage = average(published.filter((item) => item.mcqMarks != null).map((item) => item.mcqMarks!));
  const structuredAverage = average(published.filter((item) => item.structuredMarks != null).map((item) => item.structuredMarks!));

  return <div>
    <PageHeading eyebrow="MARKS & ANALYTICS" title="Results & performance"/>
    <details className="admin-create-panel"><summary><FileUp size={17}/>Import offline marks by CSV</summary><OfflineResultsImporter assessments={data.assessments} demoMode={isDemoMode()}/></details>

    <section className="dashboard-stat-grid">
      <article><div><small>Online assessment average</small><strong>{average(onlineResults.map((item) => item.percentage))?.toFixed(1) ?? "—"}%</strong><em>{onlineResults.length} published results</em></div></article>
      <article><div><small>Offline assessment average</small><strong>{average(offlineResults.map((item) => item.percentage))?.toFixed(1) ?? "—"}%</strong><em>{offlineResults.length} published results</em></div></article>
      <article><div><small>Recorded paid months</small><strong>{paidPayments.length}</strong><em>Rs. {paidPayments.reduce((sum, item) => sum + item.amount, 0).toLocaleString("en-LK")}</em></div></article>
      <article><div><small>Marking queue</small><strong>{data.results.filter((item) => item.status === "pending").length}</strong><em>Awaiting review/release</em></div></article>
    </section>

    <section className="dashboard-chart-grid">
      <article className="admin-card">
        <div className="card-heading-row"><div><span className="section-kicker">PROGRAM PERFORMANCE</span><h2>Program averages</h2></div></div>
        <div className="responsive-table"><table><thead><tr><th>Program</th><th>Students</th><th>Results</th><th>Average</th></tr></thead><tbody>{programAverages.map((item)=><tr key={item.label}><td>{item.label}</td><td>{item.students}</td><td>{item.results}</td><td><strong>{item.average?.toFixed(1) ?? "—"}%</strong></td></tr>)}</tbody></table></div>
      </article>
      <article className="admin-card">
        <div className="card-heading-row"><div><span className="section-kicker">BATCH PERFORMANCE</span><h2>Batch averages</h2></div></div>
        <div className="responsive-table"><table><thead><tr><th>Batch</th><th>Students</th><th>Results</th><th>Average</th></tr></thead><tbody>{batchAverages.map((item)=><tr key={item.label}><td>{item.label}</td><td>{item.students}</td><td>{item.results}</td><td><strong>{item.average?.toFixed(1) ?? "—"}%</strong></td></tr>)}</tbody></table></div>
      </article>
    </section>

    <section className="dashboard-chart-grid">
      <article className="admin-card">
        <div className="card-heading-row"><div><span className="section-kicker">RANKINGS</span><h2>Student averages</h2></div></div>
        <div className="responsive-table"><table><thead><tr><th>Rank</th><th>Student</th><th>Results</th><th>Average</th></tr></thead><tbody>{rankings.slice(0,10).map((item,index)=><tr key={item.student.id}><td>#{index+1}</td><td><Link href={`/adminrandinu/students/${item.student.id}`}>{item.student.fullName}</Link></td><td>{item.count}</td><td><strong>{item.average?.toFixed(1)}%</strong></td></tr>)}</tbody></table></div>
      </article>
      <article className="admin-card">
        <div className="card-heading-row"><div><span className="section-kicker">SCORE DISTRIBUTION</span><h2>Published result bands</h2></div></div>
        <div className="admin-result-list">{distribution.map((item)=><div key={item.label}><div><strong>{item.label}</strong><small>Across all published results</small></div><b>{item.count}</b></div>)}</div>
        <div className="mark-breakdown"><span><small>Average MCQ marks</small><strong>{mcqAverage?.toFixed(1) ?? "—"}</strong></span><span><small>Average structured marks</small><strong>{structuredAverage?.toFixed(1) ?? "—"}</strong></span></div>
      </article>
    </section>

    <section className="dashboard-chart-grid">
      <article className="admin-card"><div className="card-heading-row"><div><span className="section-kicker">IMPROVING</span><h2>Positive recent movement</h2></div></div><div className="admin-result-list">{improving.length ? improving.map((item)=><div key={item.student.id}><span className="up"><TrendingUp/></span><div><strong>{item.student.fullName}</strong><small>Across the latest available results</small></div><b>+{item.trend.toFixed(1)}</b></div>) : <p className="empty-copy">More result history is needed.</p>}</div></article>
      <article className="admin-card"><div className="card-heading-row"><div><span className="section-kicker">NEEDS ATTENTION</span><h2>Declining recent movement</h2></div></div><div className="admin-result-list">{declining.length ? declining.map((item)=><div key={item.student.id}><span className="down"><TrendingDown/></span><div><strong>{item.student.fullName}</strong><small>Across the latest available results</small></div><b>{item.trend.toFixed(1)}</b></div>) : <p className="empty-copy">No declining trend is currently recorded.</p>}</div></article>
    </section>

    <section className="results-table-card">
      <div className="card-heading-row"><div><span className="section-kicker">PARTICIPATION</span><h2>Completion and unsubmitted attempts</h2></div></div>
      <div className="responsive-table"><table><thead><tr><th>Assessment</th><th>Eligible</th><th>Completed</th><th>Completion</th><th>Unsubmitted</th></tr></thead><tbody>{participation.map((item)=><tr key={item.assessment.id}><td>{item.assessment.title}</td><td>{item.eligible}</td><td>{item.completed}</td><td>{item.eligible ? `${Math.round((item.completed/item.eligible)*100)}%` : "—"}</td><td>{item.unsubmitted.length ? item.unsubmitted.map((student)=>student.fullName).join(", ") : "—"}</td></tr>)}</tbody></table></div>
    </section>

    <section className="results-table-card">
      <div className="card-heading-row"><div><span className="section-kicker">ALL RESULT RECORDS</span><h2>Student marks and marking queue</h2></div><span>{ordered.length} records</span></div>
      <div className="responsive-table"><table><thead><tr><th>Student</th><th>Assessment</th><th>Source</th><th>Status</th><th>Marks</th><th>Percentage</th><th>Date</th><th>Actions</th></tr></thead><tbody>{ordered.map((result)=>{const student=data.students.find((item)=>item.id===result.studentId);return <tr key={result.id}><td><span className="table-title-cell"><strong>{student?.fullName??"Student"}</strong><span>{student?.phone}</span></span></td><td>{result.assessmentTitle}</td><td><StatusBadge tone={result.source==="school"?"neutral":"brand"}>{result.source==="school"?"School":"Smart ICT"}</StatusBadge></td><td><StatusBadge tone={result.status==="published"?"success":"warning"}>{result.status}</StatusBadge></td><td>{result.obtainedMarks}/{result.totalMarks}</td><td><strong className="score-cell"><TrendingUp size={15}/>{Math.round(result.percentage)}%</strong></td><td>{new Date(result.completedAt).toLocaleDateString("en-LK")}</td><td><div className="table-actions"><Link href={`/adminrandinu/results/${result.id}`} className={`button button-small ${result.status==="pending"?"button-primary":"button-outline"}`}>{result.status==="pending"?<ArrowRight size={14}/>:<Pencil size={14}/>} {result.status==="pending"?"Review":"Edit"}</Link><form action={deleteResultAction}><input type="hidden" name="resultId" value={result.id}/><ConfirmSubmitButton className="icon-danger-button" aria-label="Delete result" message={`Delete ${student?.fullName??"this student's"} result for ${result.assessmentTitle}?`}><Trash2 size={15}/></ConfirmSubmitButton></form></div></td></tr>})}</tbody></table></div>
    </section>
  </div>;
}
