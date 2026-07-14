import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { createModuleAction, deleteModuleAction, updateModuleAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { monthName } from "@/lib/config";
import { getAdminData } from "@/lib/data";

function localInput(value?: string | null) {
  if (!value) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function ModuleFields({ data, module }: { data: Awaited<ReturnType<typeof getAdminData>>; module?: Awaited<ReturnType<typeof getAdminData>>["modules"][number] }) {
  return <>
    {module && <input type="hidden" name="moduleId" value={module.id} />}
    <label className="field"><span>Program</span><select name="programId" required defaultValue={module?.programId}>{data.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
    <label className="field"><span>Batch</span><select name="batchId" defaultValue={module?.batchId ?? ""}><option value="">All batches</option>{data.batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
    <label className="field"><span>Month</span><select name="month" defaultValue={module?.month ?? new Date().getMonth() + 1}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{monthName(index + 1)}</option>)}</select></label>
    <label className="field"><span>Year</span><input name="year" type="number" min="2026" defaultValue={module?.year ?? 2026} required /></label>
    <label className="field full"><span>Title</span><input name="title" defaultValue={module?.title} required={Boolean(module)} /></label>
    <label className="field"><span>Access</span><select name="access" defaultValue={module?.access ?? "paid"}><option value="free">Free</option><option value="paid">Paid</option></select></label>
    <label className="field"><span>Status</span><select name="status" defaultValue={module?.status ?? "published"}><option value="draft">Draft</option><option value="published">Published</option><option value="upcoming">Upcoming</option><option value="archived">Archived</option></select></label>
    <label className="field"><span>Opens</span><input name="opensAt" type="datetime-local" defaultValue={localInput(module?.opensAt)} /></label>
    <label className="field"><span>Closes</span><input name="closesAt" type="datetime-local" defaultValue={localInput(module?.closesAt)} /></label>
  </>;
}

export default async function AdminModulesPage() {
  const data = await getAdminData();
  return <div>
    <PageHeading eyebrow="MONTHLY CONTENT" title="Modules" />
    <details className="admin-create-panel"><summary><Plus size={17} />Add module</summary><form action={createModuleAction} className="admin-form-grid"><ModuleFields data={data} /><button className="button button-primary"><Plus size={17} />Add module</button></form></details>
    <section className="admin-module-table"><div className="responsive-table"><table><thead><tr><th>Module</th><th>Program</th><th>Batch</th><th>Content</th><th>Access</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {data.modules.map((module) => <tr key={module.id}>
        <td><div className="table-title-cell"><strong>{module.title}</strong><span>{monthName(module.month)} {module.year}</span></div></td>
        <td>{data.programs.find((program) => program.id === module.programId)?.shortName}</td>
        <td>{data.batches.find((batch) => batch.id === module.batchId)?.name || "All batches"}</td>
        <td>{module.recordings.length} videos / {module.resources.length} files / {module.assessmentIds.length} tests</td>
        <td><StatusBadge tone={module.access === "free" ? "success" : "brand"}>{module.access}</StatusBadge></td>
        <td><StatusBadge tone={module.status === "published" ? "success" : module.status === "upcoming" ? "warning" : "neutral"}>{module.status}</StatusBadge></td>
        <td><div className="table-actions"><details className="inline-editor"><summary><Pencil size={15} />Edit</summary><form action={updateModuleAction} className="admin-form-grid compact-form"><ModuleFields data={data} module={module} /><button className="button button-primary"><Save size={15} />Save</button></form></details><form action={deleteModuleAction}><input type="hidden" name="moduleId" value={module.id} /><ConfirmSubmitButton className="icon-danger-button" aria-label={`Delete ${module.title}`} message={`Delete ${module.title}? Move or delete attached assessments first.`}><Trash2 size={16} /></ConfirmSubmitButton></form></div></td>
      </tr>)}
    </tbody></table></div></section>
  </div>;
}
