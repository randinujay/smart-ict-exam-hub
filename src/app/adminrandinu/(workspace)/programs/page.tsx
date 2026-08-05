import { Pencil, Plus, Save } from "lucide-react";
import { createProgramAction, updateProgramAction } from "@/app/actions/admin";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminData } from "@/lib/data";

export default async function AdminProgramsPage() {
  const data = await getAdminData();
  const programs = data.programs.filter((program) => program.isActive && ["theory", "revision"].includes(program.slug));
  return <div>
    <PageHeading eyebrow="CLASS TYPES" title="Programs" />
    <details className="admin-create-panel"><summary><Plus size={17} />Add program</summary>
      <form action={createProgramAction} className="admin-form-grid">
        <label className="field"><span>Name</span><input name="name" required /></label>
        <label className="field"><span>Short name</span><input name="shortName" required /></label>
        <label className="field"><span>URL slug</span><input name="slug" required /></label>
        <label className="field full"><span>Description</span><textarea name="description" rows={3} /></label>
        <button className="button button-primary"><Plus size={17} />Add program</button>
      </form>
    </details>
    <section className="admin-list-grid">{programs.map((program) => <article key={program.id} className="admin-manage-row">
      <div><h3>{program.name}</h3><p>{program.description}</p></div>
      <div className="row-actions"><StatusBadge tone={program.isActive ? "success" : "neutral"}>{program.isActive ? "Active" : "Inactive"}</StatusBadge>
        <details className="inline-editor"><summary><Pencil size={15} />Edit</summary><form action={updateProgramAction} className="admin-form-grid compact-form">
          <input type="hidden" name="programId" value={program.id} />
          <label className="field"><span>Name</span><input name="name" defaultValue={program.name} required /></label>
          <label className="field"><span>Short name</span><input name="shortName" defaultValue={program.shortName} required /></label>
          <label className="field"><span>URL slug</span><input name="slug" defaultValue={program.slug} required /></label>
          <label className="field full"><span>Description</span><textarea name="description" rows={3} defaultValue={program.description} /></label>
          <label className="toggle-field full"><input name="isActive" type="checkbox" defaultChecked={program.isActive} />Active</label>
          <button className="button button-primary"><Save size={16} />Save</button>
        </form></details>
      </div>
    </article>)}</section>
  </div>;
}
