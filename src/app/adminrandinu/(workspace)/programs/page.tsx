import Image from "next/image";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { createProgramAction, deleteProgramAction, updateProgramAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PublicImageField } from "@/components/admin/public-image-field";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminData } from "@/lib/data";

export default async function AdminProgramsPage() {
  const data = await getAdminData();
  return <div>
    <PageHeading eyebrow="ACADEMIC CATALOGUE" title="Programs" />
    <details className="admin-create-panel"><summary><Plus size={17} />Add program</summary>
      <form action={createProgramAction} className="admin-form-grid">
        <label className="field"><span>Name</span><input name="name" required /></label>
        <label className="field"><span>Short name</span><input name="shortName" required /></label>
        <label className="field"><span>URL slug</span><input name="slug" required /></label>
        <label className="field"><span>Level</span><select name="academicLevel" defaultValue="O/L"><option>O/L</option><option>A/L</option><option>Other</option></select></label>
        <label className="field"><span>Exam year</span><input name="examYear" type="number" min="2026" max="2100" /></label>
        <label className="field full"><span>Description</span><textarea name="description" rows={4} required /></label>
        <PublicImageField name="coverImage" label="Cover image" defaultValue="/ol-theory-poster.jpg" />
        <div className="builder-checkboxes full"><label><input name="mediums" type="checkbox" value="Sinhala" defaultChecked />Sinhala</label><label><input name="mediums" type="checkbox" value="English" defaultChecked />English</label><label><input name="isPublic" type="checkbox" defaultChecked />Public</label><label><input name="registrationOpen" type="checkbox" defaultChecked />Registration open</label></div>
        <button className="button button-primary"><Plus size={17} />Add program</button>
      </form>
    </details>

    <section className="admin-program-grid">
      {data.programs.map((program) => <article key={program.id} className="admin-manage-card">
        <div className="admin-program-image"><Image src={program.image} alt={program.name} width={500} height={320} unoptimized /></div>
        <div className="admin-manage-card-body">
          <div className="admin-program-status"><StatusBadge tone={program.isActive ? "success" : "neutral"}>{program.isActive ? "Active" : "Inactive"}</StatusBadge><StatusBadge tone={program.registrationOpen ? "brand" : "neutral"}>{program.registrationOpen ? "Open" : "Closed"}</StatusBadge></div>
          <h2>{program.name}</h2><p>{program.description}</p>
          <details className="inline-editor"><summary><Pencil size={15} />Edit</summary>
            <form action={updateProgramAction} className="admin-form-grid compact-form">
              <input type="hidden" name="programId" value={program.id} />
              <label className="field"><span>Name</span><input name="name" defaultValue={program.name} required /></label>
              <label className="field"><span>Short name</span><input name="shortName" defaultValue={program.shortName} required /></label>
              <label className="field"><span>URL slug</span><input name="slug" defaultValue={program.slug} required /></label>
              <label className="field"><span>Level</span><select name="academicLevel" defaultValue={program.academicLevel}><option>O/L</option><option>A/L</option><option>Other</option></select></label>
              <label className="field"><span>Exam year</span><input name="examYear" type="number" defaultValue={program.examYear ?? ""} /></label>
              <label className="field full"><span>Description</span><textarea name="description" rows={4} defaultValue={program.description} required /></label>
              <PublicImageField name="coverImage" label="Cover image" defaultValue={program.image} />
              <div className="builder-checkboxes full"><label><input name="mediums" type="checkbox" value="Sinhala" defaultChecked={program.medium.includes("Sinhala")} />Sinhala</label><label><input name="mediums" type="checkbox" value="English" defaultChecked={program.medium.includes("English")} />English</label><label><input name="isPublic" type="checkbox" defaultChecked={program.isPublic} />Public</label><label><input name="registrationOpen" type="checkbox" defaultChecked={program.registrationOpen} />Registration open</label><label><input name="isActive" type="checkbox" defaultChecked={program.isActive} />Active</label></div>
              <button className="button button-primary"><Save size={16} />Save</button>
            </form>
          </details>
          <form action={deleteProgramAction} className="danger-action"><input type="hidden" name="programId" value={program.id} /><ConfirmSubmitButton className="button button-danger button-small" message={`Delete ${program.name}? This only works after linked modules, payments and student assignments are removed.`}><Trash2 size={15} />Delete</ConfirmSubmitButton></form>
        </div>
      </article>)}
    </section>
  </div>;
}
