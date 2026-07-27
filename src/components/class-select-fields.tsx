"use client";

import { useId, useState } from "react";

interface ClassSelectFieldsProps {
  programs: Array<{ id: string; name: string; isActive?: boolean }>;
  academicBatches: Array<{ id: string; name: string; isActive?: boolean }>;
  batches: Array<{ id: string; programId: string; academicBatchId: string; name: string; isActive?: boolean }>;
  defaultProgramId?: string;
  defaultBatchId?: string;
  compact?: boolean;
}

export function ClassSelectFields({
  programs,
  academicBatches,
  batches,
  defaultProgramId = "",
  defaultBatchId = "",
  compact = false,
}: ClassSelectFieldsProps) {
  const id = useId();
  const defaultClass = batches.find((item) => item.id === defaultBatchId);
  const [academicBatchId, setAcademicBatchId] = useState(defaultClass?.academicBatchId ?? "");
  const [programId, setProgramId] = useState(defaultProgramId);
  const availableClasses = batches.filter((item) => item.academicBatchId === academicBatchId && item.isActive !== false);
  const availablePrograms = programs.filter((program) => program.isActive !== false && availableClasses.some((item) => item.programId === program.id));
  const selectedClass = availableClasses.find((item) => item.programId === programId);
  const batchSelect = <select id={`${id}-academic-batch`} name="academicBatchId" aria-label="Batch" value={academicBatchId} onChange={(event) => { setAcademicBatchId(event.target.value); setProgramId(""); }} required>
    <option value="" disabled>Batch</option>
    {academicBatches.filter((batch) => batch.isActive !== false).map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
  </select>;
  const programSelect = <select id={`${id}-program`} name="programId" aria-label="Program" value={programId} onChange={(event) => setProgramId(event.target.value)} disabled={!academicBatchId} required>
    <option value="" disabled>{academicBatchId ? "Program" : "Select batch first"}</option>
    {availablePrograms.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
  </select>;

  if (compact) return <>{batchSelect}{programSelect}<input type="hidden" name="batchId" value={selectedClass?.id ?? ""} /></>;
  return <>
    <label className="field" htmlFor={`${id}-academic-batch`}><span>Batch</span>{batchSelect}</label>
    <label className="field" htmlFor={`${id}-program`}><span>Program</span>{programSelect}</label>
    <input type="hidden" name="batchId" value={selectedClass?.id ?? ""} />
  </>;
}
