import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/server/api-auth";

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  try {
    const payload = await request.json();
    if (!String(payload.title ?? "").trim()) return NextResponse.json({ error: "An assessment title is required." }, { status: 400 });
    const hasAudience = [payload.programIds, payload.batchIds, payload.studentIds].some((items) => Array.isArray(items) && items.length);
    if (payload.access !== "free" && !hasAudience) {
      return NextResponse.json({ error: "Paid assessments need a program, batch or individual student audience." }, { status: 400 });
    }
    if (payload.access !== "free" && !payload.moduleId) {
      return NextResponse.json({ error: "Paid assessments must belong to a monthly module." }, { status: 400 });
    }
    if (payload.timing === "strict" && (!payload.startsAt || !payload.endsAt || Date.parse(payload.endsAt) <= Date.parse(payload.startsAt))) {
      return NextResponse.json({ error: "Strict assessments need a valid start time and a later end time." }, { status: 400 });
    }
    if (payload.timing === "flexible" && payload.delivery === "online" && (!Number.isInteger(payload.durationMinutes) || payload.durationMinutes < 1 || payload.durationMinutes > 360)) {
      return NextResponse.json({ error: "Flexible assessments need a duration from 1 to 360 minutes." }, { status: 400 });
    }
    if (!Number.isInteger(payload.maxAttempts) || payload.maxAttempts < 1 || payload.maxAttempts > 10) {
      return NextResponse.json({ error: "Attempt limit must be between 1 and 10." }, { status: 400 });
    }
    if (payload.delivery === "online" && (!Array.isArray(payload.questions) || !payload.questions.length)) {
      return NextResponse.json({ error: "Online assessments need at least one question." }, { status: 400 });
    }
    if (Array.isArray(payload.questions)) {
      const allowedTypes = new Set(["single_choice", "multiple_choice", "true_false", "short_answer", "structured"]);
      for (const [index, question] of payload.questions.entries()) {
        if (!allowedTypes.has(question.type) || !String(question.prompt ?? "").trim()) {
          return NextResponse.json({ error: `Question ${index + 1} needs a valid type and prompt.` }, { status: 400 });
        }
        const marks = Number(question.marks);
        if (!Number.isFinite(marks) || marks <= 0) return NextResponse.json({ error: `Question ${index + 1} has invalid marks.` }, { status: 400 });
        if (question.imageUrl) {
          try {
            const imageUrl = new URL(String(question.imageUrl));
            if (imageUrl.protocol !== "https:" && imageUrl.protocol !== "http:") throw new Error();
          } catch {
            return NextResponse.json({ error: `Question ${index + 1} has an invalid image URL.` }, { status: 400 });
          }
        }
        if (["single_choice", "multiple_choice", "true_false"].includes(question.type)) {
          if (!Array.isArray(question.options) || question.options.length < 2 || question.options.some((option: { text?: unknown }) => !String(option.text ?? "").trim())) {
            return NextResponse.json({ error: `Question ${index + 1} needs at least two completed options.` }, { status: 400 });
          }
          const answers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
          if (!answers.length || answers.some((answer: unknown) => !String(answer ?? "").trim())) {
            return NextResponse.json({ error: `Question ${index + 1} needs a correct answer.` }, { status: 400 });
          }
        }
        if (question.type === "short_answer" && !String(question.correctAnswer ?? "").trim()) {
          return NextResponse.json({ error: `Question ${index + 1} needs an expected answer.` }, { status: 400 });
        }
      }
    }
    const { data, error } = await auth.supabase.rpc("create_assessment_bundle", { p_payload: payload });
    if (error) throw error;
    return NextResponse.json({ id: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save assessment." }, { status: 500 });
  }
}
