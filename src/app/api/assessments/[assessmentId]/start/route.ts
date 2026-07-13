import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server/api-auth";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ assessmentId: string }> },
) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { assessmentId } = await params;
  const { data: attempt, error: startError } = await auth.supabase.rpc(
    "start_assessment_attempt",
    { p_assessment_id: assessmentId },
  );
  if (startError || !attempt) {
    return NextResponse.json({ error: startError?.message ?? "Could not start assessment." }, { status: 400 });
  }

  const { data: started, error: paperError } = await auth.supabase.rpc(
    "get_started_assessment",
    { p_attempt_id: attempt.id },
  );
  if (paperError || !started) {
    return NextResponse.json({ error: paperError?.message ?? "Could not load assessment questions." }, { status: 400 });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    deadlineAt: attempt.deadline_at,
    assessment: started.assessment,
    savedAnswers: started.savedAnswers ?? {},
    flagged: started.flagged ?? [],
  });
}
