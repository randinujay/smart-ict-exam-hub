import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/server/api-auth";

type Payload = Record<string, unknown> & { questions?: Array<Record<string, unknown>> };

function validate(payload: Payload) {
  if (!String(payload.title ?? "").trim()) return "An assessment title is required.";
  const hasAudience = [payload.programIds, payload.batchIds, payload.studentIds].some((items) => Array.isArray(items) && items.length);
  if (payload.access !== "free" && !hasAudience) return "Paid assessments need an audience.";
  if (payload.access !== "free" && !payload.moduleId) return "Paid assessments must belong to a monthly module.";
  if (payload.timing === "strict" && (!payload.startsAt || !payload.endsAt || Date.parse(String(payload.endsAt)) <= Date.parse(String(payload.startsAt)))) return "Set a valid start time and a later end time.";
  if (payload.timing === "flexible" && payload.delivery === "online" && (!Number.isInteger(payload.durationMinutes) || Number(payload.durationMinutes) < 1 || Number(payload.durationMinutes) > 360)) return "Duration must be between 1 and 360 minutes.";
  if (!Number.isInteger(payload.maxAttempts) || Number(payload.maxAttempts) < 1 || Number(payload.maxAttempts) > 10) return "Attempt limit must be between 1 and 10.";
  if (payload.delivery === "online" && (!Array.isArray(payload.questions) || !payload.questions.length)) return "Online assessments need at least one question.";
  const allowedTypes = new Set(["single_choice", "multiple_choice", "true_false", "short_answer", "structured"]);
  for (const [index, question] of (payload.questions ?? []).entries()) {
    if (!allowedTypes.has(String(question.type)) || !String(question.prompt ?? "").trim()) return `Question ${index + 1} needs a type and prompt.`;
    const marks = Number(question.marks);
    if (!Number.isFinite(marks) || marks <= 0) return `Question ${index + 1} has invalid marks.`;
    if (question.imageUrl) {
      try {
        const imageUrl = new URL(String(question.imageUrl));
        if (!["https:", "http:"].includes(imageUrl.protocol)) throw new Error();
      } catch { return `Question ${index + 1} has an invalid image URL.`; }
    }
    if (["single_choice", "multiple_choice", "true_false"].includes(String(question.type))) {
      const options = Array.isArray(question.options) ? question.options as Array<{ text?: unknown }> : [];
      if (options.length < 2 || options.some((option) => !String(option.text ?? "").trim())) return `Question ${index + 1} needs completed options.`;
      const answers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
      if (!answers.length || answers.some((answer) => !String(answer ?? "").trim())) return `Question ${index + 1} needs a correct answer.`;
    }
    if (question.type === "short_answer" && !String(question.correctAnswer ?? "").trim()) return `Question ${index + 1} needs an expected answer.`;
  }
  return null;
}

async function save(request: Request, mode: "create" | "update") {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;
  try {
    const payload = await request.json() as Payload;
    const validationError = validate(payload);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    if (mode === "update" && !/^[0-9a-f-]{36}$/i.test(String(payload.assessmentId ?? ""))) return NextResponse.json({ error: "Invalid assessment." }, { status: 400 });
    const { data, error } = await auth.supabase.rpc(mode === "create" ? "create_assessment_bundle" : "update_assessment_bundle", mode === "create"
      ? { p_payload: payload }
      : { p_assessment_id: payload.assessmentId, p_payload: payload });
    if (error) throw error;
    return NextResponse.json({ id: data }, { status: mode === "create" ? 201 : 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save assessment." }, { status: 500 });
  }
}

export async function POST(request: Request) { return save(request, "create"); }
export async function PUT(request: Request) { return save(request, "update"); }
