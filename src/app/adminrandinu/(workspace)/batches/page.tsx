import { Pencil, Plus, Save, Trash2, UsersRound } from "lucide-react";
import {
  createAcademicBatchAction,
  createBatchAction,
  deleteAcademicBatchAction,
  deleteBatchAction,
  updateAcademicBatchAction,
  updateBatchAction,
} from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminData } from "@/lib/data";

export default async function AdminBatchesPage() {
  const data = await getAdminData();
  const programs = data.programs.filter((item) => item.isActive);
  return <div>
    <PageHeading eyebrow="CLASS STRUCTURE" title="Batches & Classes" />
    <div className="admin-two-column">
      <details className="admin-create-panel"><summary><Plus size={17} />Add batch</summary><form action={createAcademicBatchAction} className="admin-form-grid">
        <label className="field"><span>Exam year</span><input name="examYear" type="number" min="2026" max="2200" required /></label>
        <label className="field"><span>Level</span><select name="academicLevel" defaultValue="O/L"><option>O/L</option><option>A/L</option><option>Other</option></select></label>
        <button className="button button-primary"><Plus size={17} />Add batch</button>
      </form></details>
      <details className="admin-create-panel"><summary><Plus size={17} />Add class</summary><form action={createBatchAction} className="admin-form-grid">
        <label className="field"><span>Batch</span><select name="academicBatchId" required><option value="">Select batch</option>{data.academicBatches.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="field"><span>Program</span><select name="programId" required><option value="">Select program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
        <label className="toggle-field full"><input name="registrationOpen" type="checkbox" defaultChecked />Registration open</label>
        <button className="button button-primary"><Plus size={17} />Add class</button>
      </form></details>
    </div>

    <section className="admin-list-grid">{data.academicBatches.map((academicBatch) => {
      const classes = data.batches.filter((item) => item.academicBatchId === academicBatch.id);
      return <article key={academicBatch.id} className="admin-manage-row batch-group-row">
        <span className="admin-list-icon"><UsersRound /></span>
        <div><h3>{academicBatch.name}</h3><p>{classes.filter((item) => item.isActive).map((item) => data.programs.find((program) => program.id === item.programId)?.name).filter(Boolean).join(" · ") || "No active classes"}</p></div>
        <div className="row-actions"><StatusBadge tone={academicBatch.isActive ? "success" : "neutral"}>{academicBatch.isActive ? "Active" : "Inactive"}</StatusBadge>
          <details className="inline-editor"><summary><Pencil size={15} />Edit batch</summary><form action={updateAcademicBatchAction} className="admin-form-grid compact-form">
            <input type="hidden" name="academicBatchId" value={academicBatch.id} />
            <label className="field"><span>Exam year</span><input name="examYear" type="number" defaultValue={academicBatch.examYear} required /></label>
            <label className="field"><span>Level</span><select name="academicLevel" defaultValue={academicBatch.academicLevel}><option>O/L</option><option>A/L</option><option>Other</option></select></label>
            <label className="toggle-field full"><input name="isActive" type="checkbox" defaultChecked={academicBatch.isActive} />Active</label>
            <button className="button button-primary"><Save size={15} />Save</button>
          </form></details>
          <form action={deleteAcademicBatchAction}><input type="hidden" name="academicBatchId" value={academicBatch.id} /><ConfirmSubmitButton className="icon-danger-button" aria-label={`Delete ${academicBatch.name}`} title="Delete batch" message={`Delete ${academicBatch.name}? It must have no classes.`}><Trash2 size={16} /></ConfirmSubmitButton></form>
        </div>
        {classes.length > 0 && <div className="full class-combination-list">{classes.map((item) => <div key={item.id} className="class-combination-row">
          <strong>{item.className}</strong>
          <span>{item.registrationOpen ? "Registration open" : "Registration closed"}</span>
          <StatusBadge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Active" : "Inactive"}</StatusBadge>
          <details className="inline-editor"><summary><Pencil size={15} />Edit</summary><form action={updateBatchAction} className="admin-form-grid compact-form">
            <input type="hidden" name="batchId" value={item.id} />
            <label className="field"><span>Batch</span><select name="academicBatchId" defaultValue={item.academicBatchId}>{data.academicBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
            <label className="field"><span>Program</span><select name="programId" defaultValue={item.programId}>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
            <label className="toggle-field"><input name="registrationOpen" type="checkbox" defaultChecked={item.registrationOpen} />Registration open</label>
            <label className="toggle-field"><input name="isActive" type="checkbox" defaultChecked={item.isActive} />Active</label>
            <button className="button button-primary"><Save size={15} />Save</button>
          </form></details>
          <form action={deleteBatchAction}><input type="hidden" name="batchId" value={item.id} /><ConfirmSubmitButton className="icon-danger-button" aria-label={`Delete ${item.className}`} title="Delete class" message={`Delete ${item.className}? Linked records must be removed first.`}><Trash2 size={16} /></ConfirmSubmitButton></form>
        </div>)}</div>}
      </article>;
    })}</section>
  </div>;
}
