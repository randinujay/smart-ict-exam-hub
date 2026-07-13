import Link from "next/link";
import { ChevronRight, Files, LockKeyhole, PlayCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { ModuleItem } from "@/lib/types";

export function ModuleCard({ module, unlocked }: { module: ModuleItem; unlocked: boolean }) {
  return (
    <article className={`module-card ${unlocked ? "" : "is-locked"}`}>
      <div className="module-card-top">
        <div className="module-calendar"><span>{String(module.month).padStart(2, "0")}</span><small>{module.year}</small></div>
        <div>{module.status === "upcoming" ? <StatusBadge tone="neutral">Upcoming</StatusBadge> : unlocked ? <StatusBadge tone="success">Available</StatusBadge> : <StatusBadge tone="warning">Locked</StatusBadge>}</div>
      </div>
      <h3>{module.title}</h3>
      <div className="module-meta">
        <span><PlayCircle size={16} /> {module.recordings.length} recording{module.recordings.length === 1 ? "" : "s"}</span>
        <span><Files size={16} /> {module.resources.length} resource{module.resources.length === 1 ? "" : "s"}</span>
      </div>
      {unlocked ? (
        <Link href={`/app/modules/${module.id}`} className="module-open-link">Open module <ChevronRight size={17} /></Link>
      ) : (
        <div className="module-lock-copy"><LockKeyhole size={17} /> Payment or verification required</div>
      )}
    </article>
  );
}
