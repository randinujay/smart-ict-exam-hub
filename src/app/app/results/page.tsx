import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { LineChart } from "@/components/line-chart";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { getStudentDashboardData } from "@/lib/data";

export default async function StudentResultsPage() {
  const data = await getStudentDashboardData();
  const ordered = [...data.results].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  const smart = ordered.filter((item) => item.source === "smart_ict");
  const average = smart.length ? Math.round(smart.reduce((sum, item) => sum + item.percentage, 0) / smart.length) : 0;
  const best = smart.length ? Math.max(...smart.map((item) => item.percentage)) : 0;
  return <div><PageHeading eyebrow="ACADEMIC RECORD" title="Results" />
    {!ordered.length ? <section className="empty-state empty-state-large"><ClipboardCheck size={28} /><h2>No results yet</h2><p>Published marks will appear here after you complete an assessment.</p><Link href="/app/assessments" className="button button-primary">View assessments</Link></section> : <>
      <section className="result-stat-row"><article><small>Best Smart ICT mark</small><strong>{Math.round(best)}%</strong></article><article><small>Smart ICT average</small><strong>{average}%</strong></article><article><small>Published results</small><strong>{ordered.length}</strong></article></section>
      {smart.length > 1 && <section className="dashboard-card chart-card result-chart-card"><div className="card-heading-row"><h2>Assessment progress</h2></div><LineChart results={[...smart].reverse()} /></section>}
      <section className="results-table-card admin-table-card"><div className="responsive-table"><table><thead><tr><th>Assessment</th><th>Source</th><th>Date</th><th>Marks</th><th>Score</th><th /></tr></thead><tbody>{ordered.map((result) => <tr key={result.id}><td><div className="table-title-cell"><strong>{result.assessmentTitle}</strong>{result.feedback && <span>{result.feedback}</span>}</div></td><td><StatusBadge tone={result.source === "school" ? "neutral" : "brand"}>{result.source === "school" ? "School" : "Smart ICT"}</StatusBadge></td><td>{new Date(result.completedAt).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" })}</td><td>{result.obtainedMarks}/{result.totalMarks}</td><td><strong>{Math.round(result.percentage)}%</strong></td><td><Link href={`/app/results/${result.id}`}>View <ArrowRight size={15} /></Link></td></tr>)}</tbody></table></div></section>
    </>}
  </div>;
}
