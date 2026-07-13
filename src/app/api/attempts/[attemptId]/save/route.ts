import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server/api-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const { attemptId } = await params;

  try {
    const body = await request.json();
    const { error } = await auth.supabase.rpc("save_assessment_answers", {
      p_attempt_id: attemptId,
      p_answers: body.answers ?? {},
      p_flagged: body.flagged ?? [],
    });
    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save answers." },
      { status: 400 },
    );
  }
}
