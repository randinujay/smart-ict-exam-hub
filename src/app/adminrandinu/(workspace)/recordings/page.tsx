import { Pencil, PlayCircle, Plus, Save, Trash2 } from "lucide-react";
import { createRecordingAction, deleteRecordingAction, updateRecordingAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminData } from "@/lib/data";

export default async function AdminRecordingsPage() {
  const data = await getAdminData();
  const recordings = data.modules.flatMap((module) => module.recordings.map((recording) => ({ ...recording, moduleTitle: module.title })));
  return <div>
    <PageHeading eyebrow="VIDEO CONTENT" title="Recordings" />
    <details className="admin-create-panel"><summary><Plus size={17} />Add recording</summary><form action={createRecordingAction} className="admin-form-grid">
      <label className="field"><span>Module</span><select name="moduleId" required>{data.modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</select></label>
      <label className="field"><span>Title</span><input name="title" required /></label>
      <label className="field full"><span>Description</span><textarea name="description" rows={3} /></label>
      <label className="field"><span>Video URL</span><input name="videoUrl" type="url" required /></label>
      <label className="field"><span>Duration</span><input name="duration" /></label>
      <label className="field"><span>Access</span><select name="access" defaultValue="paid"><option value="free">Free</option><option value="paid">Paid</option></select></label>
      <label className="toggle-field"><input name="isPublished" type="checkbox" defaultChecked />Published</label>
      <button className="button button-primary"><Plus size={17} />Add recording</button>
    </form></details>
    <section className="admin-list-grid recordings-admin-list">{recordings.map((recording) => <article key={recording.id} className="admin-manage-row">
      <span className="admin-list-icon"><PlayCircle /></span><div><h3>{recording.title}</h3><p>{recording.moduleTitle}{recording.duration ? ` / ${recording.duration}` : ""}</p></div>
      <div className="row-actions"><StatusBadge tone={recording.access === "free" ? "success" : "brand"}>{recording.access}</StatusBadge>
        <details className="inline-editor"><summary><Pencil size={15} />Edit</summary><form action={updateRecordingAction} className="admin-form-grid compact-form">
          <input type="hidden" name="recordingId" value={recording.id} />
          <label className="field"><span>Module</span><select name="moduleId" defaultValue={recording.moduleId}>{data.modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</select></label>
          <label className="field"><span>Title</span><input name="title" defaultValue={recording.title} required /></label>
          <label className="field full"><span>Description</span><textarea name="description" rows={3} defaultValue={recording.description} /></label>
          <label className="field"><span>Video URL</span><input name="videoUrl" type="url" defaultValue={recording.videoUrl} required /></label>
          <label className="field"><span>Duration</span><input name="duration" defaultValue={recording.duration} /></label>
          <label className="field"><span>Access</span><select name="access" defaultValue={recording.access}><option value="free">Free</option><option value="paid">Paid</option></select></label>
          <label className="toggle-field"><input name="isPublished" type="checkbox" defaultChecked />Published</label>
          <button className="button button-primary"><Save size={15} />Save</button>
        </form></details>
        <form action={deleteRecordingAction}><input type="hidden" name="recordingId" value={recording.id} /><ConfirmSubmitButton className="icon-danger-button" aria-label={`Delete ${recording.title}`} message={`Delete ${recording.title}?`}><Trash2 size={16} /></ConfirmSubmitButton></form>
      </div>
    </article>)}</section>
  </div>;
}
