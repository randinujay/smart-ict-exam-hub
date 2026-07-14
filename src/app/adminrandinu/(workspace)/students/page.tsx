import Link from "next/link";
import { ArrowRight, CheckCircle2, Search, ShieldCheck, XCircle } from "lucide-react";
import { assignStudentAction, reviewStudentProgramRequestAction, updateStudentStatusAction } from "@/app/actions/admin";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { displayPhone } from "@/lib/auth";
import { getAdminData } from "@/lib/data";

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; program?: string }> }) {
  const [data, filters] = await Promise.all([getAdminData(), searchParams]);
  const query = (filters.q ?? "").trim().toLowerCase();
  const students = data.students.filter((student) => {
    const matchesQuery = !query || [student.fullName, student.phone, student.school].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = !filters.status || filters.status === "all" || student.accountStatus === filters.status;
    const matchesProgram = !filters.program || filters.program === "all" || student.programIds.includes(filters.program) || student.requestedProgramId === filters.program;
    return matchesQuery && matchesStatus && matchesProgram;
  });
  return <div>
    <PageHeading eyebrow="STUDENT MANAGEMENT" title="Students" />
    <form className="admin-toolbar" method="get"><div className="search-field"><Search size={18} /><input name="q" defaultValue={filters.q} placeholder="Name, phone or school" /></div><select name="status" defaultValue={filters.status ?? "all"}><option value="all">All statuses</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="suspended">Suspended</option></select><select name="program" defaultValue={filters.program ?? "all"}><option value="all">All programs</option>{data.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select><button className="button button-dark button-small">Filter</button></form>
    <section className="student-admin-list">{students.length ? students.map((student) => <article key={student.id} className="student-admin-card">
      <div className="student-admin-primary"><span className="profile-avatar-small">{student.firstName[0]}{student.lastName[0]}</span><div><div className="student-title-row"><h3>{student.fullName}</h3><StatusBadge tone={student.accountStatus === "verified" ? "success" : student.accountStatus === "pending" ? "warning" : "danger"}>{student.accountStatus}</StatusBadge></div><p>{student.school} / {student.medium}</p><small>{displayPhone(student.phone)}</small></div></div>
      <div className="student-admin-details"><span><small>Requested program</small><strong>{student.requestedProgramId ? data.programs.find((program) => program.id === student.requestedProgramId)?.shortName ?? "Unavailable" : "None"}</strong></span><span><small>Enrolled program</small><strong>{student.programIds.map((id) => data.programs.find((program) => program.id === id)?.shortName).filter(Boolean).join(", ") || "Not assigned"}</strong></span><span><small>Batch</small><strong>{student.batchIds.map((id) => data.batches.find((batch) => batch.id === id)?.name).filter(Boolean).join(", ") || "Not assigned"}</strong></span></div>
      {student.requestedProgramStatus === "pending" && <div className="student-program-request"><div><strong>Program request</strong><span>Approve the request or select another program.</span></div><form action={reviewStudentProgramRequestAction}><input type="hidden" name="studentId" value={student.id}/><select name="programId" defaultValue={student.requestedProgramId ?? ""} required><option value="" disabled>Select program</option>{data.programs.filter((program) => program.isActive).map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select><button name="decision" value="approve" className="button button-primary button-small"><CheckCircle2 size={15}/>Approve & enrol</button><button name="decision" value="reject" className="button button-outline button-small"><XCircle size={15}/>Reject</button></form></div>}
      <div className="student-admin-actions"><Link href={`/adminrandinu/students/${student.id}`} className="button button-outline button-small">Profile <ArrowRight size={14} /></Link><form action={updateStudentStatusAction}><input type="hidden" name="studentId" value={student.id} /><select name="accountStatus" defaultValue={student.accountStatus}><option value="pending">Pending</option><option value="verified">Verified</option><option value="suspended">Suspended</option></select><button className="button button-dark button-small"><ShieldCheck size={15} />Save status</button></form><form action={assignStudentAction}><input type="hidden" name="studentId" value={student.id} /><select name="programId" required defaultValue={student.programIds[0] || ""}><option value="" disabled>Program</option>{data.programs.map((program) => <option key={program.id} value={program.id}>{program.shortName}</option>)}</select><select name="batchId" defaultValue={student.batchIds[0] || ""}><option value="">No batch</option>{data.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select><button className="button button-primary button-small"><CheckCircle2 size={15} />Assign</button></form></div>
    </article>) : <div className="empty-state">No students match these filters.</div>}</section>
  </div>;
}
