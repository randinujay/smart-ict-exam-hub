import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarCheck2, ClipboardCheck, Download, LockKeyhole, Sparkles, Trophy } from "lucide-react";
import { LineChart } from "@/components/line-chart";
import { ModuleCard } from "@/components/module-card";
import { SmartInsights } from "@/components/smart-insights";
import { StatusBadge } from "@/components/status-badge";
import { getStudentDashboardData } from "@/lib/data";
import { buildSmartInsights } from "@/lib/insights";
import { canOpenAssessment, hasPaidModuleAccess } from "@/lib/access";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage(){
  const data=await getStudentDashboardData();
  const {student,results,payments,modules,assessments,resources,programs}=data;
  const smartResults=results.filter((result)=>result.source==="smart_ict");
  const schoolResults=results.filter((result)=>result.source==="school");
  const latest=[...smartResults].sort((a,b)=>new Date(b.completedAt).getTime()-new Date(a.completedAt).getTime())[0];
  const average=smartResults.length?Math.round(smartResults.reduce((sum,item)=>sum+item.percentage,0)/smartResults.length):0;
  const availableAssessments=assessments.filter((assessment)=>canOpenAssessment(student,assessment,modules.find((module)=>module.id===assessment.moduleId),payments));
  const insights=buildSmartInsights(results);
  const billingParts=Object.fromEntries(new Intl.DateTimeFormat("en",{timeZone:"Asia/Colombo",year:"numeric",month:"2-digit"}).formatToParts(new Date()).map((part)=>[part.type,part.value]));
  const currentBillingMonth=`${billingParts.year}-${billingParts.month}`;
  const currentPayments=payments.filter((payment)=>payment.billingMonth.startsWith(currentBillingMonth));
  const hasCurrentAccess=currentPayments.some((payment)=>payment.status==="paid"||payment.status==="waived");
  return <div className="dashboard-page">
    <section className="dashboard-welcome">
      <div><span className="section-kicker">{greeting().toUpperCase()}</span><h1>{greeting()}, {student.firstName} <span>👋</span></h1><p>Here is your Smart ICT journey at a glance.</p></div>
      <div className="dashboard-account-chip"><span className={`account-dot ${student.accountStatus}`}/><div><small>Account status</small><strong>{student.accountStatus === "verified" ? "Verified student" : student.accountStatus === "pending" ? "Verification pending" : "Account suspended"}</strong></div></div>
    </section>

    {student.accountStatus === "pending" && <section className="account-notice"><Sparkles size={22}/><div><strong>Your dashboard is ready while verification is pending.</strong><p>You can use free resources and free assessments now. Paid monthly content unlocks after an administrator verifies your account and assigns your program.</p></div><Link href="/app/support">Need help?</Link></section>}
    {student.accountStatus === "suspended" && <section className="account-notice danger"><LockKeyhole size={22}/><div><strong>Your exclusive access is currently suspended.</strong><p>Free public resources may remain visible, but paid content is unavailable. Contact Smart ICT support for assistance.</p></div><Link href="/app/support">Contact support</Link></section>}

    <section className="dashboard-stat-grid">
      <article><span className="stat-icon"><Trophy size={20}/></span><div><small>Latest Smart ICT mark</small><strong>{latest?`${Math.round(latest.percentage)}%`:"—"}</strong><em>{latest?.assessmentTitle??"Complete your first assessment"}</em></div></article>
      <article><span className="stat-icon"><CalendarCheck2 size={20}/></span><div><small>Smart ICT average</small><strong>{smartResults.length?`${average}%`:"—"}</strong><em>{smartResults.length} published result{smartResults.length===1?"":"s"}</em></div></article>
      <article><span className="stat-icon"><BookOpenCheck size={20}/></span><div><small>Exams completed</small><strong>{results.length}</strong><em>Published Smart ICT and school results</em></div></article>
      <article><span className="stat-icon"><ClipboardCheck size={20}/></span><div><small>Current payment status</small><strong>{hasCurrentAccess?"Paid":"Not recorded"}</strong><em>{programs[0]?.shortName??"No program assigned"}</em></div></article>
    </section>

    <section className="dashboard-chart-grid">
      <article className="dashboard-card chart-card"><div className="card-heading-row"><div><span className="section-kicker">SMART ICT PROGRESS</span><h2>Class assessment marks</h2></div><StatusBadge tone="brand">{smartResults.length} results</StatusBadge></div><LineChart results={smartResults}/></article>
      <article className="dashboard-card chart-card school-chart"><div className="card-heading-row"><div><span className="section-kicker">SCHOOL JOURNEY</span><h2>Term examination marks</h2></div><StatusBadge tone="neutral">Offline records</StatusBadge></div><LineChart results={schoolResults}/></article>
    </section>

    <section className="dashboard-middle-grid"><SmartInsights insights={insights}/><article className="dashboard-card quick-access-card"><div className="card-heading-row"><div><span className="section-kicker">QUICK ACCESS</span><h2>Continue your journey</h2></div></div><div className="quick-access-list"><Link href="/app/modules"><BookOpenCheck/><div><strong>Open monthly modules</strong><span>Recordings, resources and assessments</span></div><ArrowRight/></Link><Link href="/app/resources"><Download/><div><strong>Browse resources</strong><span>Free and paid downloadable material</span></div><ArrowRight/></Link><Link href="/app/assessments"><ClipboardCheck/><div><strong>Exams & quizzes</strong><span>See what is available to you now</span></div><ArrowRight/></Link></div></article></section>

    <section className="dashboard-section-row"><div><span className="section-kicker">MONTHLY MODULES</span><h2>Your learning content</h2></div><Link href="/app/modules">View all modules <ArrowRight size={16}/></Link></section>
    <section className="module-grid compact-module-grid">{modules.slice(-3).map((module)=><ModuleCard key={module.id} module={module} unlocked={hasPaidModuleAccess(student,module,payments)}/>)}</section>

    <section className="dashboard-bottom-grid">
      <article className="dashboard-card"><div className="card-heading-row"><div><span className="section-kicker">RECENT RESOURCES</span><h2>New downloads</h2></div><Link href="/app/resources">See all</Link></div><div className="resource-mini-list">{resources.slice(0,4).map((resource)=><div key={resource.id}><span className="file-type-chip">{resource.fileType}</span><div><strong>{resource.title}</strong><small>{new Date(resource.publishedAt).toLocaleDateString("en-LK",{day:"numeric",month:"short",year:"numeric"})}</small></div>{resource.access==="free"?<StatusBadge tone="success">Free</StatusBadge>:<StatusBadge tone="brand">Module</StatusBadge>}</div>)}</div></article>
      <article className="dashboard-card"><div className="card-heading-row"><div><span className="section-kicker">AVAILABLE NOW</span><h2>Exams & quizzes</h2></div><Link href="/app/assessments">See all</Link></div><div className="assessment-mini-list">{availableAssessments.slice(0,4).map((assessment)=><Link key={assessment.id} href={`/app/assessments/${assessment.id}`}><span><ClipboardCheck size={18}/></span><div><strong>{assessment.title}</strong><small>{assessment.delivery==="online"?`${assessment.durationMinutes??"—"} min · ${assessment.timing}`:"Offline result"}</small></div><ArrowRight size={16}/></Link>)}</div></article>
    </section>
  </div>
}
