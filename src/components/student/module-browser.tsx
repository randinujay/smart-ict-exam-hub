"use client";

import { useMemo, useState } from "react";
import { ModuleCard } from "@/components/module-card";
import { hasPaidModuleAccess } from "@/lib/access";
import type { DashboardData } from "@/lib/types";

export function ModuleBrowser({ data }: { data: DashboardData }) {
  const [filter,setFilter]=useState("all");
  const items=useMemo(()=>data.modules.filter((module)=>{
    const unlocked=hasPaidModuleAccess(data.student,module,data.payments);
    if(filter==="available")return unlocked;
    if(filter==="locked")return !unlocked;
    if(filter==="upcoming")return module.status==="upcoming";
    return true;
  }),[data,filter]);
  return <><div className="module-filter-row"><span>Showing {items.length} module{items.length===1?"":"s"}</span><select aria-label="Filter modules" value={filter} onChange={(event)=>setFilter(event.target.value)}><option value="all">All modules</option><option value="available">Available</option><option value="locked">Locked</option><option value="upcoming">Upcoming</option></select></div>{items.length?<section className="module-grid">{items.map((module)=><ModuleCard key={module.id} module={module} unlocked={hasPaidModuleAccess(data.student,module,data.payments)}/>)}</section>:<div className="chart-empty">No modules match this filter.</div>}</>;
}
