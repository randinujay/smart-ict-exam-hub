"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardCheck, LockKeyhole, TimerReset } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { canOpenAssessment } from "@/lib/access";
import type { DashboardData } from "@/lib/types";

export function AssessmentBrowser({ data }: { data: DashboardData }) {
  const [filter, setFilter] = useState("all");
  const completedIds = useMemo(() => new Set(data.results.map((item) => item.assessmentId)), [data.results]);
  const items = useMemo(() => data.assessments.filter((assessment) => {
    const monthlyModule = data.modules.find((item) => item.id === assessment.moduleId);
    const available = canOpenAssessment(data.student, assessment, monthlyModule, data.payments);
    if (filter === "available") return available && assessment.delivery === "online" && !completedIds.has(assessment.id);
    if (filter === "completed") return completedIds.has(assessment.id);
    if (filter === "offline") return assessment.delivery === "offline";
    return true;
  }), [completedIds, data, filter]);

  return <>
    <div className="assessment-filter-tabs">
      {[["all", "All assessments"], ["available", "Available now"], ["completed", "Completed"], ["offline", "Offline results"]].map(([value, label]) => (
        <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>
      ))}
    </div>
    {items.length ? <section className="assessment-card-grid">
      {items.map((assessment) => {
        const monthlyModule = data.modules.find((item) => item.id === assessment.moduleId);
        const canOpen = canOpenAssessment(data.student, assessment, monthlyModule, data.payments);
        return <article key={assessment.id} className={`assessment-card ${canOpen ? "" : "is-locked"}`}>
          <div className="assessment-card-top">
            <span className="assessment-icon"><ClipboardCheck size={23}/></span>
            <div>{assessment.delivery === "offline" ? <StatusBadge tone="neutral">Offline</StatusBadge> : assessment.access === "free" ? <StatusBadge tone="success">Free</StatusBadge> : canOpen ? <StatusBadge tone="brand">Available</StatusBadge> : <StatusBadge tone="warning">Locked</StatusBadge>}</div>
          </div>
          <h3>{assessment.title}</h3>
          <p>{assessment.description}</p>
          <div className="assessment-card-meta">
            <span><TimerReset size={16}/>{assessment.delivery === "online" ? `${assessment.durationMinutes ?? "—"} minutes` : "Marks uploaded by teacher"}</span>
            <span><CalendarClock size={16}/>{assessment.timing === "strict" ? "Strict time window" : "Flexible attempt"}</span>
          </div>
          {canOpen ? <Link href={`/app/assessments/${assessment.id}`} className="button button-primary button-full">{assessment.delivery === "online" ? "Open assessment" : "View record"}<ArrowRight size={16}/></Link> : <div className="locked-assessment-note"><LockKeyhole size={16}/>Not available to this account</div>}
        </article>;
      })}
    </section> : <div className="chart-empty">No assessments match this filter.</div>}
  </>;
}
