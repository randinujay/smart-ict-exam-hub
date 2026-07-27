import { BadgeDollarSign, Pencil, Save, Trash2 } from "lucide-react";
import { deletePaymentAction, markPaymentAction, updatePaymentAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ClassSelectFields } from "@/components/class-select-fields";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { displayPhone } from "@/lib/auth";
import { getAdminData } from "@/lib/data";

export default async function AdminPaymentsPage() {
  const data = await getAdminData();
  return <div>
    <PageHeading eyebrow="MONTHLY ACCESS" title="Payments" />
    <details className="admin-create-panel"><summary><BadgeDollarSign size={17} />Record payment</summary><form action={markPaymentAction} className="admin-form-grid">
      <label className="field"><span>Student</span><select name="studentId" required>{data.students.map((student) => <option key={student.id} value={student.id}>{student.fullName} - {displayPhone(student.phone)}</option>)}</select></label>
      <ClassSelectFields programs={data.programs} batches={data.batches} />
      <label className="field"><span>Month</span><input name="billingMonth" type="month" required defaultValue={new Date().toISOString().slice(0, 7)} /></label>
      <label className="field"><span>Amount (LKR)</span><input name="amount" type="number" min="0" defaultValue="0" required /></label>
      <label className="field"><span>Status</span><select name="status" defaultValue="paid"><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="waived">Waived</option></select></label>
      <label className="field full"><span>Notes</span><textarea name="notes" rows={3} /></label>
      <button className="button button-primary"><Save size={16} />Save payment</button>
    </form></details>
    <section className="results-table-card admin-table-card">{data.payments.length ? <div className="responsive-table"><table><thead><tr><th>Student</th><th>Month</th><th>Program</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {data.payments.map((payment) => { const student = data.students.find((item) => item.id === payment.studentId); const program = data.programs.find((item) => item.id === payment.programId); return <tr key={payment.id}>
        <td><div className="table-title-cell"><strong>{student?.fullName ?? "Student"}</strong><span>{student ? displayPhone(student.phone) : ""}</span></div></td>
        <td>{new Date(payment.billingMonth).toLocaleDateString("en-LK", { month: "long", year: "numeric" })}</td><td>{program?.shortName}</td><td>LKR {payment.amount.toLocaleString()}</td><td><StatusBadge tone={payment.status === "paid" || payment.status === "waived" ? "success" : "warning"}>{payment.status}</StatusBadge></td>
        <td><div className="table-actions"><details className="inline-editor"><summary><Pencil size={15} />Edit</summary><form action={updatePaymentAction} className="admin-form-grid compact-form">
          <input type="hidden" name="paymentId" value={payment.id} />
          <ClassSelectFields programs={data.programs} batches={data.batches} defaultProgramId={payment.programId} defaultBatchId={payment.batchId ?? ""} />
          <label className="field"><span>Month</span><input name="billingMonth" type="month" defaultValue={payment.billingMonth.slice(0, 7)} required /></label>
          <label className="field"><span>Amount</span><input name="amount" type="number" min="0" defaultValue={payment.amount} required /></label>
          <label className="field"><span>Status</span><select name="status" defaultValue={payment.status}><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="waived">Waived</option></select></label>
          <label className="field full"><span>Notes</span><textarea name="notes" rows={3} defaultValue={payment.notes ?? ""} /></label>
          <button className="button button-primary"><Save size={15} />Save</button>
        </form></details><form action={deletePaymentAction}><input type="hidden" name="paymentId" value={payment.id} /><ConfirmSubmitButton className="icon-danger-button" aria-label="Delete payment" message="Delete this payment record?"><Trash2 size={16} /></ConfirmSubmitButton></form></div></td>
      </tr>; })}
    </tbody></table></div> : <div className="empty-state">No payments recorded.</div>}</section>
  </div>;
}
