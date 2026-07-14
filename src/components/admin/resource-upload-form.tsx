"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ModuleItem, Program } from "@/lib/types";

function safeName(name: string) { return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-"); }

export function ResourceUploadForm({ programs, modules, demoMode }: { programs: Program[]; modules: ModuleItem[]; demoMode: boolean }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) { setMessage("Choose a file to upload."); setBusy(false); return; }
    if (file.size > 25 * 1024 * 1024) { setMessage("Keep resource files below 25 MB."); setBusy(false); return; }
    if (demoMode) { await new Promise((resolve) => setTimeout(resolve, 500)); setMessage("Demo upload completed. Configure Supabase Storage to persist files."); setBusy(false); event.currentTarget.reset(); return; }
    let uploadedPath: string | null = null;
    try {
      const supabase = createClient();
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from("resources").upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      uploadedPath = path;
      const response = await fetch("/api/admin/resources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        title: form.get("title"), description: form.get("description"), moduleId: form.get("moduleId") || null,
        fileName: file.name, storagePath: path, fileType: form.get("fileType"), access: form.get("access"),
        programIds: form.getAll("programIds"), isPublished: true,
      }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "Could not save resource metadata.");
      setMessage("Resource uploaded and published."); event.currentTarget.reset();
    } catch (error) {
      if (uploadedPath) {
        const supabase = createClient();
        await supabase.storage.from("resources").remove([uploadedPath]);
      }
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    }
    finally { setBusy(false); }
  }

  return <form className="admin-form-grid" onSubmit={submit}>
    <label className="field"><span>Resource title</span><input name="title" required /></label>
    <label className="field"><span>File type</span><select name="fileType" defaultValue="PDF"><option>PDF</option><option>Tute</option><option>Worksheet</option><option>Past Paper</option><option>Image</option><option>Other</option></select></label>
    <label className="field full"><span>Description</span><textarea name="description" rows={3} /></label>
    <label className="field"><span>Monthly module</span><select name="moduleId" defaultValue=""><option value="">Independent resource</option>{modules.map((module)=><option key={module.id} value={module.id}>{module.title}</option>)}</select></label>
    <label className="field"><span>Access</span><select name="access" defaultValue="paid"><option value="free">Free</option><option value="paid">Paid / module access</option></select></label>
    <fieldset className="field full choice-fieldset"><legend>Programs</legend><div className="builder-checkboxes">{programs.map((program)=><label key={program.id}><input name="programIds" type="checkbox" value={program.id}/>{program.name}</label>)}</div></fieldset>
    <label className="field full file-field"><span>Choose file</span><input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip" required /></label>
    {message&&<p className="form-message full">{message}</p>}
    <button className="button button-primary" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:<UploadCloud size={18}/>}Upload resource</button>
  </form>;
}
