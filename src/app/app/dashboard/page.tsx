import Link from "next/link";
import { ArrowRight, BookOpenCheck, ClipboardCheck, Download, LockKeyhole, Sparkles } from "lucide-react";
import { LineChart } from "@/components/line-chart";
import { ModuleCard } from "@/components/module-card";
import { SmartInsights } from "@/components/smart-insights";
import { getStudentDashboardData } from "@/lib/data";
import { buildSmartInsights } from "@/lib/insights";
import { canOpenAssessment, hasPaidModuleAccess } from "@/lib/access";

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const data = await getStudentDashboardData();
  const { student, results, payments, modules, assessments, resources } = data;
  const smartResults = results.filter((result) => result.source === "smart_ict");
  const latest = [...smartResults].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
  const average = smartResults.length ? Math.round(smartResults.reduce((sum, item) => sum + item.percentage, 0) / smartResults.length) : null;
  const availableAssessments = assessments.filter((assessment) => canOpenAssessment(student, assessment, modules.find((module) => module.id === assessment.moduleId), payments));
  const currentMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit" }).format(new Date());
  const hasCurrentAccess = payments.some((payment) => payment.billingMonth.startsWith(currentMonth) && ["paid", "waived"].includes(payment.status));
  return <div className="dashboard-page">
    <section className="dashboard-welcome"><div><span className="section-kicker">{greeting().toUpperCase()}</span><h1>{greeting()}, {student.firstName}</h1></div><div className="dashboard-account-chip"><span className={`account-dot ${student.accountStatus}`} /><strong>{student.accountStatus === "verified" ? "Verified" : student.accountStatus === "pending" ? "Pending verification" : "Suspended"}</strong></div></section>
    {student.accountStatus === "pending" && <section className="account-notice"><Sparkles size={20} /><div><strong>Verification is pending.</strong><p>You can use free content now. Full access opens after teacher approval.</p></div><Link href="/app/support">Contact support</Link></section>}
    {student.accountStatus === "suspended" && <section className="account-notice danger"><LockKeyhole size={20} /><div><strong>Account access is suspended.</strong></div><Link href="/app/support">Contact support</Link></section>}

    <section className="dashboard-stat-grid">
      <article><small>Latest mark</small><strong>{latest ? `${Math.round(latest.percentage)}%` : "-"}</strong></article>
      <article><small>Average</small><strong>{average === null ? "-" : `${average}%`}</strong></article>
      <article><small>Completed tests</small><strong>{results.length}</strong></article>
      <article><small>This month&apos;s access</small><strong>{hasCurrentAccess ? "Paid" : "Not recorded"}</strong></article>
    </section>

    <section className="dashboard-card quick-access-card"><div className="quick-access-list"><Link href="/app/modules"><BookOpenCheck /><strong>Modules</strong><ArrowRight /></Link><Link href="/app/resources"><Download /><strong>Resources</strong><ArrowRight /></Link><Link href="/app/assessments"><ClipboardCheck /><strong>Exams & quizzes</strong><ArrowRight /></Link></div></section>

    {smartResults.length ? <section className="dashboard-middle-grid"><article className="dashboard-card chart-card"><div className="card-heading-row"><h2>Assessment progress</h2><Link href="/app/results">All results</Link></div><LineChart results={smartResults} /></article><SmartInsights insights={buildSmartInsights(results)} /></section> : <section className="dashboard-card getting-started-card"><ClipboardCheck size={24} /><div><h2>Your progress starts with your first assessment.</h2><p>{availableAssessments.length ? "You have an assessment ready to take." : "New assessments will appear when they are assigned."}</p></div>{availableAssessments[0] && <Link href={`/app/assessments/${availableAssessments[0].id}`} className="button button-primary">Open assessment</Link>}</section>}

    {modules.length > 0 && <><div className="dashboard-section-row"><h2>Latest modules</h2><Link href="/app/modules">View all <ArrowRight size={16} /></Link></div><section className="module-grid compact-module-grid">{modules.slice(0, 3).map((module) => <ModuleCard key={module.id} module={module} unlocked={hasPaidModuleAccess(student, module, payments)} />)}</section></>}
    {(resources.length > 0 || availableAssessments.length > 0) && <section className="dashboard-bottom-grid">
      {resources.length > 0 && <article className="dashboard-card"><div className="card-heading-row"><h2>Recent resources</h2><Link href="/app/resources">All</Link></div><div className="resource-mini-list">{resources.slice(0, 4).map((resource) => <div key={resource.id}><strong>{resource.title}</strong><span>{resource.fileType}</span></div>)}</div></article>}
      {availableAssessments.length > 0 && <article className="dashboard-card"><div className="card-heading-row"><h2>Available tests</h2><Link href="/app/assessments">All</Link></div><div className="assessment-mini-list">{availableAssessments.slice(0, 4).map((assessment) => <Link key={assessment.id} href={`/app/assessments/${assessment.id}`}><strong>{assessment.title}</strong><ArrowRight size={16} /></Link>)}</div></article>}
    </section>}
  </div>;
}
