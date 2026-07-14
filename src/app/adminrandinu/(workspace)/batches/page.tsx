import { Pencil, Plus, Save, Trash2, UsersRound } from "lucide-react";
import { createBatchAction, deleteBatchAction, updateBatchAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminData } from "@/lib/data";

export default async function AdminBatchesPage() {
  const data = await getAdminData();
  return <div>
    <PageHeading eyebrow="STUDENT GROUPS" title="Batches" />
    <details className="admin-create-panel"><summary><Plus size={17} />Add batch</summary><form action={createBatchAction} className="admin-form-grid">
      <label className="field"><span>Program</span><select name="programId" required>{data.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
      <label className="field"><span>Name</span><input name="name" required /></label>
      <label className="field full"><span>Description</span><textarea name="description" rows={3} /></label>
      <button className="button button-primary"><Plus size={17} />Add batch</button>
    </form></details>
    <section className="admin-list-grid">{data.batches.map((batch) => <article key={batch.id} className="admin-manage-row">
      <span className="admin-list-icon"><UsersRound /></span>
      <div><h3>{batch.name}</h3><p>{data.programs.find((program) => program.id === batch.programId)?.name}</p></div>
      <div className="row-actions"><StatusBadge tone={batch.isActive ? "success" : "neutral"}>{batch.isActive ? "Active" : "Inactive"}</StatusBadge>
        <details className="inline-editor"><summary><Pencil size={15} />Edit</summary><form action={updateBatchAction} className="admin-form-grid compact-form">
          <input type="hidden" name="batchId" value={batch.id} />
          <label className="field"><span>Program</span><select name="programId" defaultValue={batch.programId}>{data.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
          <label className="field"><span>Name</span><input name="name" defaultValue={batch.name} required /></label>
          <label className="field full"><span>Description</span><textarea name="description" rows={3} defaultValue={batch.description} /></label>
          <label className="toggle-field full"><input name="isActive" type="checkbox" defaultChecked={batch.isActive} />Active</label>
          <button className="button button-primary"><Save size={15} />Save</button>
        </form></details>
        <form action={deleteBatchAction}><input type="hidden" name="batchId" value={batch.id} /><ConfirmSubmitButton className="icon-danger-button" aria-label={`Delete ${batch.name}`} title="Delete" message={`Delete ${batch.name}? Linked students or modules must be removed first.`}><Trash2 size={16} /></ConfirmSubmitButton></form>
      </div>
    </article>)}</section>
  </div>;
}
