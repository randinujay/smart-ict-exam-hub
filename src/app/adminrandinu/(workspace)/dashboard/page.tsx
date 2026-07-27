import Link from "next/link";
import { ArrowRight, BadgeDollarSign, ClipboardCheck, Layers3, UserRoundCheck, UsersRound } from "lucide-react";
import { getAdminDashboardSummary } from "@/lib/data";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Colombo", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardSummary();
  const date = new Intl.DateTimeFormat("en-LK", { timeZone: "Asia/Colombo", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const stats = [
    { label: "Students", value: data.stats.students, meta: `${data.stats.verified} verified`, href: "/adminrandinu/students", icon: UsersRound },
    { label: "Pending", value: data.stats.pending, meta: "Review accounts", href: "/adminrandinu/students", icon: UserRoundCheck, attention: data.stats.pending > 0 },
    { label: "Live modules", value: data.stats.publishedModules, meta: `${data.stats.programs} programs`, href: "/adminrandinu/modules", icon: Layers3 },
    { label: "Paid this month", value: data.stats.paidThisMonth, meta: "Recorded access", href: "/adminrandinu/payments", icon: BadgeDollarSign },
  ];
  const actions = [
    { href: "/adminrandinu/students", label: "Students", icon: UserRoundCheck },
    { href: "/adminrandinu/modules", label: "Add module", icon: Layers3 },
    { href: "/adminrandinu/assessments/new", label: "Create test", icon: ClipboardCheck },
    { href: "/adminrandinu/payments", label: "Record payment", icon: BadgeDollarSign },
  ];

  return <div className="admin-home">
    <header className="admin-home-header">
      <div><span>{date}</span><h1>{greeting()}, Randinu.</h1></div>
      <Link href="/adminrandinu/assessments/new" className="button button-primary">Create test <ArrowRight size={16} /></Link>
    </header>

    <section className="admin-home-stats">
      {stats.map(({ label, value, meta, href, icon: Icon, attention }) => <Link href={href} key={label} className={attention ? "attention" : ""}>
        <span><Icon size={19} /></span><small>{label}</small><strong>{value}</strong><em>{meta}</em>
      </Link>)}
    </section>

    <section className="admin-home-grid">
      <article className="admin-card admin-attention-card">
        <div className="card-heading-row"><h2>Needs attention</h2><Link href="/adminrandinu/students">All students <ArrowRight size={15} /></Link></div>
        <div className="admin-home-students">
          {data.pendingStudents.length ? data.pendingStudents.map((student) => <Link href={`/adminrandinu/students/${student.id}`} key={student.id}>
            <span className="workspace-avatar">{student.initials}</span>
            <div><strong>{student.fullName}</strong><small>{student.school} / {student.medium}</small></div>
            <b>Review</b>
          </Link>) : <div className="admin-home-empty"><UserRoundCheck size={22} /><span>No pending accounts</span></div>}
        </div>
      </article>

      <article className="admin-card admin-actions-card">
        <div className="card-heading-row"><h2>Quick actions</h2></div>
        <div className="admin-home-actions">{actions.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><span><Icon size={19} /></span><strong>{label}</strong><ArrowRight size={16} /></Link>)}</div>
      </article>
    </section>

    <section className="admin-card admin-recent-card">
      <div className="card-heading-row"><h2>Recent results</h2><Link href="/adminrandinu/results">View all <ArrowRight size={15} /></Link></div>
      {data.recentResults.length ? <div className="admin-home-results">{data.recentResults.map((result) => <Link href={`/adminrandinu/results/${result.id}`} key={result.id}>
        <div><strong>{result.assessmentTitle}</strong><small>{result.studentName}</small></div>
        <span>{Math.round(result.percentage)}%</span>
      </Link>)}</div> : <div className="admin-home-empty"><ClipboardCheck size={22} /><span>No published results yet</span></div>}
    </section>
  </div>;
}
