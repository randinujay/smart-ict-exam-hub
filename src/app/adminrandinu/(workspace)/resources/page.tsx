import { Pencil, Save, Trash2, UploadCloud } from "lucide-react";
import { deleteResourceAction, updateResourceAction } from "@/app/actions/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ResourceUploadForm } from "@/components/admin/resource-upload-form";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { getAdminData } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";

export default async function AdminResourcesPage() {
  const data = await getAdminData();
  return <div>
    <PageHeading eyebrow="DOWNLOAD LIBRARY" title="Resources" />
    <details className="admin-create-panel"><summary><UploadCloud size={17} />Upload resource</summary><ResourceUploadForm classes={data.batches} modules={data.modules} demoMode={!isSupabaseConfigured()} /></details>
    <section className="admin-card admin-table-card"><div className="responsive-table"><table><thead><tr><th>Resource</th><th>Module</th><th>Audience</th><th>Access</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {data.resources.map((resource) => <tr key={resource.id}>
        <td><div className="table-title-cell"><strong>{resource.title}</strong><span>{resource.fileName} / {resource.fileType}</span></div></td>
        <td>{data.modules.find((module) => module.id === resource.moduleId)?.title || "Independent"}</td>
        <td>{resource.batchIds.length ? resource.batchIds.map((id) => data.batches.find((item) => item.id === id)?.className).filter(Boolean).join(", ") : "All students"}</td>
        <td><StatusBadge tone={resource.access === "free" ? "success" : "brand"}>{resource.access}</StatusBadge></td>
        <td><StatusBadge tone={resource.isPublished === false ? "neutral" : "success"}>{resource.isPublished === false ? "Hidden" : "Published"}</StatusBadge></td>
        <td><div className="table-actions">
          <details className="inline-editor"><summary><Pencil size={15} />Edit</summary><form action={updateResourceAction} className="admin-form-grid compact-form">
            <input type="hidden" name="resourceId" value={resource.id} />
            <label className="field"><span>Title</span><input name="title" defaultValue={resource.title} required /></label>
            <label className="field"><span>File type</span><select name="fileType" defaultValue={resource.fileType}><option>PDF</option><option>Tute</option><option>Worksheet</option><option>Past Paper</option><option>Image</option><option>Other</option></select></label>
            <label className="field full"><span>Description</span><textarea name="description" rows={3} defaultValue={resource.description} /></label>
            <label className="field"><span>Module</span><select name="moduleId" defaultValue={resource.moduleId ?? ""}><option value="">Independent</option>{data.modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</select></label>
            <label className="field"><span>Access</span><select name="access" defaultValue={resource.access}><option value="free">Free</option><option value="paid">Paid</option></select></label>
            <label className="field full"><span>Classes</span><select name="batchIds" multiple size={Math.min(Math.max(data.batches.length, 3), 7)} defaultValue={resource.batchIds}>{data.batches.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.className}</option>)}</select></label>
            <label className="toggle-field full"><input name="isPublished" type="checkbox" defaultChecked={resource.isPublished ?? true} />Published</label>
            <button className="button button-primary"><Save size={15} />Save</button>
          </form></details>
          <form action={deleteResourceAction}><input type="hidden" name="resourceId" value={resource.id} /><ConfirmSubmitButton className="icon-danger-button" aria-label={`Delete ${resource.title}`} message={`Delete ${resource.title} and its uploaded file?`}><Trash2 size={16} /></ConfirmSubmitButton></form>
        </div></td>
      </tr>)}
    </tbody></table></div></section>
  </div>;
}
