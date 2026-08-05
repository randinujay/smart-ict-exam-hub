import { CalendarDays, GraduationCap, LockKeyhole, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { AddNicForm } from "@/components/add-nic-form";
import { displayPhone } from "@/lib/auth";
import { getStudentDashboardData } from "@/lib/data";

export default async function ProfilePage() {
  const data = await getStudentDashboardData();
  const { student } = data;
  const rows = [
    { label: "Full name", value: student.fullName, icon: UserRound },
    { label: "Contact number", value: displayPhone(student.phone), icon: Phone },
    { label: "Date of birth", value: new Date(student.dateOfBirth).toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric" }), icon: CalendarDays },
    { label: "School", value: student.school, icon: GraduationCap },
    { label: "Medium", value: `${student.medium} Medium`, icon: GraduationCap },
    { label: "Address", value: student.address, icon: MapPin },
    { label: "NIC", value: student.nic || "Not added", icon: ShieldCheck },
  ];
  return <div><PageHeading eyebrow="STUDENT RECORD" title="Profile"/><section className="profile-page-grid"><article className="profile-summary-card"><div className="profile-avatar-large">{student.firstName[0]}{student.lastName[0]}</div><h2>{student.fullName}</h2><p>{student.school}</p><StatusBadge tone={student.accountStatus === "verified" ? "success" : student.accountStatus === "pending" ? "warning" : "danger"}>{student.accountStatus}</StatusBadge><div className="profile-programs"><small>Assigned programs</small>{data.programs.length ? data.programs.map((program) => <span key={program.id}>{program.name}</span>) : <span>No program assigned yet</span>}</div></article><div><article className="profile-details-card"><div className="card-heading-row"><div><span className="section-kicker">REGISTERED INFORMATION</span><h2>Locked student details</h2></div><LockKeyhole size={22}/></div><div className="profile-detail-list">{rows.map(({ label, value, icon: Icon }) => <div key={label}><span><Icon size={18}/></span><div><small>{label}</small><strong>{value}</strong></div>{label !== "NIC" && <LockKeyhole size={14} aria-label="Locked"/>}</div>)}</div></article>{!student.nic && <article className="profile-nic-card"><span className="section-kicker">ONE-TIME ADDITION</span><h2>Add your NIC once</h2><p>This cannot be edited after saving.</p><AddNicForm/></article>}</div></section></div>;
}
