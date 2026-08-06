import { getPublicAcademicBatches, getPublicBatches, getPublicPrograms } from "@/lib/data";

// Single source of truth for "what can a student pick on /register right now" —
// used by both the register page (to render options) and registerStudentAction
// (to resolve submitted opaque codes back to real IDs). Both call sites must
// filter identically, or a code generated on render could fail to resolve, or
// worse, resolve to the wrong row, on submit.
export async function getOpenRegistrationOptions() {
  const [allPrograms, allAcademicBatches, allClasses] = await Promise.all([
    getPublicPrograms(),
    getPublicAcademicBatches(),
    getPublicBatches(),
  ]);
  const programs = allPrograms.filter((program) => program.registrationOpen);
  const programIds = new Set(programs.map((program) => program.id));
  const classes = allClasses.filter((item) => programIds.has(item.programId));
  const activeAcademicBatchIds = new Set(classes.map((item) => item.academicBatchId));
  const academicBatches = allAcademicBatches.filter((item) => activeAcademicBatchIds.has(item.id));
  return { programs, academicBatches, classes };
}
