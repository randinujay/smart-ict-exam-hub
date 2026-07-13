import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, KeyRound, Save, ShieldCheck } from "lucide-react";
import { resetStudentPasswordAction, setStudentAccessOverrideAction, updateStudentDetailsAction } from "@/app/actions/admin";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { displayPhone } from "@/lib/auth";
import { getAdminData } from "@/lib/data";

export default async function AdminStudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const data = await getAdminData();
  const student = data.students.find((item) => item.id === studentId);
  if (!student) notFound();
  const recordings = data.modules.flatMap((monthlyModule) => monthlyModule.recordings);

  return <div>
    <Link href="/adminrandinu/students" className="back-link"><ArrowLeft size={16}/>Back to students</Link>
    <PageHeading
      eyebrow="STUDENT ACCOUNT"
      title={student.fullName}
      description={`${displayPhone(student.phone)} · ${student.school}`}
      actions={<StatusBadge tone={student.accountStatus === "verified" ? "success" : student.accountStatus === "pending" ? "warning" : "danger"}>{student.accountStatus}</StatusBadge>}
    />

    <section className="student-edit-grid">
      <article className="admin-card">
        <span className="section-kicker">REGISTRATION DETAILS</span><h2>Correct student information</h2>
        <p className="form-note">Students cannot edit these fields. Any verified correction is made here by the administrator.</p>
        <form action={updateStudentDetailsAction} className="admin-form-grid">
          <input type="hidden" name="studentId" value={student.id}/>
          <label className="field"><span>First name</span><input name="firstName" defaultValue={student.firstName} required/></label>
          <label className="field"><span>Last name</span><input name="lastName" defaultValue={student.lastName} required/></label>
          <label className="field"><span>Date of birth</span><input name="dateOfBirth" type="date" defaultValue={student.dateOfBirth.slice(0,10)} required/></label>
          <label className="field"><span>NIC</span><input name="nic" defaultValue={student.nic ?? ""}/></label>
          <label className="field"><span>Contact number / login</span><input name="phone" defaultValue={displayPhone(student.phone)} required/></label>
          <label className="field"><span>Medium</span><select name="medium" defaultValue={student.medium}><option value="Sinhala">Sinhala</option><option value="English">English</option></select></label>
          <label className="field full"><span>Address</span><textarea name="address" rows={3} defaultValue={student.address} required/></label>
          <label className="field full"><span>School</span><input name="school" defaultValue={student.school} required/></label>
          <button className="button button-primary"><Save size={17}/>Save verified corrections</button>
        </form>
      </article>

      <aside className="admin-card password-reset-card">
        <span className="settings-icon"><KeyRound/></span><span className="section-kicker">ACCOUNT RECOVERY</span>
        <h2>Set a temporary password</h2><p>The student can immediately sign in using this password and their registered phone number.</p>
        <form action={resetStudentPasswordAction} className="auth-form">
          <input type="hidden" name="studentId" value={student.id}/>
          <label className="field"><span>Temporary password</span><input name="temporaryPassword" type="password" minLength={8} required/></label>
          <button className="button button-dark button-full"><KeyRound size={17}/>Reset password</button>
        </form>
      </aside>
    </section>

    <section className="admin-card">
      <span className="settings-icon"><ShieldCheck/></span><span className="section-kicker">INDIVIDUAL ACCESS</span>
      <h2>Allow or block specific content</h2>
      <p className="form-note">An individual override takes priority over normal program, batch, payment and free-content rules.</p>
      <form action={setStudentAccessOverrideAction} className="admin-form-grid">
        <input type="hidden" name="studentId" value={student.id}/>
        <label className="field full"><span>Content</span><select name="content" required defaultValue=""><option value="" disabled>Select content</option>
          <optgroup label="Monthly modules">{data.modules.map((item)=><option key={item.id} value={`module:${item.id}`}>{item.title}</option>)}</optgroup>
          <optgroup label="Recordings">{recordings.map((item)=><option key={item.id} value={`recording:${item.id}`}>{item.title}</option>)}</optgroup>
          <optgroup label="Resources">{data.resources.map((item)=><option key={item.id} value={`resource:${item.id}`}>{item.title}</option>)}</optgroup>
          <optgroup label="Assessments">{data.assessments.map((item)=><option key={item.id} value={`assessment:${item.id}`}>{item.title}</option>)}</optgroup>
        </select></label>
        <label className="field"><span>Decision</span><select name="decision" defaultValue="allow"><option value="allow">Allow access</option><option value="deny">Block access</option></select></label>
        <label className="field"><span>Optional expiry</span><input name="expiresAt" type="datetime-local"/></label>
        <label className="field full"><span>Reason</span><input name="reason" placeholder="Special paper, temporary access, payment exception…"/></label>
        <button className="button button-primary"><ShieldCheck size={17}/>Save access override</button>
      </form>
    </section>

    <section className="results-table-card">
      <div className="card-heading-row"><div><span className="section-kicker">PERFORMANCE HISTORY</span><h2>Published and pending results</h2></div></div>
      <div className="responsive-table"><table><thead><tr><th>Assessment</th><th>Source</th><th>Status</th><th>Marks</th><th>Percentage</th><th>Date</th></tr></thead><tbody>
        {data.results.filter((result)=>result.studentId===student.id).sort((a,b)=>new Date(b.completedAt).getTime()-new Date(a.completedAt).getTime()).map((result)=><tr key={result.id}><td>{result.assessmentTitle}</td><td>{result.source==="school"?"School":"Smart ICT"}</td><td><StatusBadge tone={result.status==="published"?"success":"warning"}>{result.status}</StatusBadge></td><td>{result.obtainedMarks}/{result.totalMarks}</td><td>{result.percentage.toFixed(1)}%</td><td>{new Date(result.completedAt).toLocaleDateString("en-LK")}</td></tr>)}
      </tbody></table></div>
    </section>
  </div>;
}
