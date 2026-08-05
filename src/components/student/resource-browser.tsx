"use client";

import { useMemo, useState } from "react";
import { Download, FileText, LockKeyhole, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { hasPaidModuleAccess } from "@/lib/access";
import type { DashboardData } from "@/lib/types";

export function ResourceBrowser({ data }: { data: DashboardData }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [access, setAccess] = useState("all");

  const items = useMemo(() => data.resources.filter((resource) => {
    const text = `${resource.title} ${resource.description ?? ""} ${resource.fileType}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (type !== "all" && resource.fileType !== type) return false;
    if (access !== "all" && resource.access !== access) return false;
    return true;
  }), [access, data.resources, query, type]);

  const fileTypes = Array.from(new Set(data.resources.map((item) => item.fileType)));

  return <>
    <div className="resource-toolbar">
      <div className="search-field"><Search size={18}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search resources" aria-label="Search resources"/></div>
      <select aria-label="Resource type" value={type} onChange={(event)=>setType(event.target.value)}><option value="all">All file types</option>{fileTypes.map((item)=><option key={item} value={item}>{item}</option>)}</select>
      <select aria-label="Access" value={access} onChange={(event)=>setAccess(event.target.value)}><option value="all">All access</option><option value="free">Free</option><option value="paid">Module access</option></select>
    </div>
    {items.length ? <section className="resource-library-grid">{items.map((resource)=>{
      const monthlyModule=resource.moduleId?data.modules.find((item)=>item.id===resource.moduleId):undefined;
      const unlocked=resource.isUnlocked??(resource.access==="free"||Boolean(monthlyModule&&hasPaidModuleAccess(data.student,monthlyModule,data.payments)));
      return <article key={resource.id} className={`resource-library-card ${unlocked?"":"is-locked"}`}>
        <div className="resource-library-top"><span className="resource-file-icon"><FileText size={24}/></span>{resource.access==="free"?<StatusBadge tone="success">Free</StatusBadge>:unlocked?<StatusBadge tone="brand">Available</StatusBadge>:<StatusBadge tone="warning">Locked</StatusBadge>}</div>
        <h3>{resource.title}</h3><p>{resource.description}</p>
        <div className="resource-details"><span>{resource.fileType}</span><span>{new Date(resource.publishedAt).toLocaleDateString("en-LK",{day:"numeric",month:"short",year:"numeric"})}</span></div>
        {unlocked?<a href={resource.fileUrl} className="button button-primary button-full"><Download size={16}/>Download resource</a>:<div className="locked-resource-note"><LockKeyhole size={16}/>Requires access to {monthlyModule?.title??"a paid module"}</div>}
      </article>
    })}</section>:<div className="chart-empty">No resources match those filters.</div>}
  </>;
}
