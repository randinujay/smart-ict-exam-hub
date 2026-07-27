"use client";

import { useId, useState } from "react";

interface ClassSelectFieldsProps {
  programs: Array<{ id: string; name: string; isActive?: boolean }>;
  batches: Array<{ id: string; programId: string; name: string; isActive?: boolean }>;
  defaultProgramId?: string;
  defaultBatchId?: string;
  compact?: boolean;
}

export function ClassSelectFields({
  programs,
  batches,
  defaultProgramId = "",
  defaultBatchId = "",
  compact = false,
}: ClassSelectFieldsProps) {
  const id = useId();
  const [programId, setProgramId] = useState(defaultProgramId);
  const availableBatches = batches.filter((batch) => batch.programId === programId && batch.isActive !== false);
  const programSelect = <select id={`${id}-program`} name="programId" aria-label="Program" value={programId} onChange={(event) => setProgramId(event.target.value)} required>
    <option value="" disabled>Program</option>
    {programs.filter((program) => program.isActive !== false).map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
  </select>;
  const batchSelect = <select id={`${id}-batch`} name="batchId" aria-label="Batch" key={programId} defaultValue={batches.some((batch) => batch.id === defaultBatchId && batch.programId === programId) ? defaultBatchId : ""} disabled={!programId} required>
    <option value="" disabled>{programId ? "Batch" : "Select program first"}</option>
    {availableBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
  </select>;

  if (compact) return <>{programSelect}{batchSelect}</>;
  return <>
    <label className="field" htmlFor={`${id}-program`}><span>Program</span>{programSelect}</label>
    <label className="field" htmlFor={`${id}-batch`}><span>Batch</span>{batchSelect}</label>
  </>;
}
