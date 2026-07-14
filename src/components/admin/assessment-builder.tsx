"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronUp, CirclePlus, Copy, LoaderCircle, Save, Trash2 } from "lucide-react";
import type { Assessment, Batch, ModuleItem, Program, QuestionType, StudentProfile } from "@/lib/types";

type DraftOption = { id: string; key: string; text: string };
type DraftQuestion = { id: string; type: QuestionType; prompt: string; marks: number; imageUrl: string; options: DraftOption[]; correctAnswer: string | string[]; explanation: string };

interface AssessmentBuilderProps {
  programs: Program[];
  batches: Batch[];
  modules: ModuleItem[];
  students: StudentProfile[];
  demoMode: boolean;
  assessment?: Assessment;
  questionsLocked?: boolean;
}

function newQuestion(type: QuestionType = "single_choice"): DraftQuestion {
  const options = type === "true_false"
    ? [{ id: crypto.randomUUID(), key: "True", text: "True" }, { id: crypto.randomUUID(), key: "False", text: "False" }]
    : ["A", "B", "C", "D"].map((key) => ({ id: crypto.randomUUID(), key, text: "" }));
  return { id: crypto.randomUUID(), type, prompt: "", marks: 1, imageUrl: "", options, correctAnswer: type === "multiple_choice" ? [] : "", explanation: "" };
}

function colomboLocalToIso(value: FormDataEntryValue | null) {
  const input = String(value ?? "").trim();
  if (!input || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return null;
  const parsed = new Date(`${input}:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function isoToColomboLocal(value?: string | null) {
  if (!value) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function initialQuestions(assessment?: Assessment): DraftQuestion[] {
  if (!assessment?.questions.length) return [newQuestion()];
  return assessment.questions.map((question) => ({
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    marks: question.marks,
    imageUrl: question.imageUrl ?? "",
    options: (question.options ?? []).map((option) => ({ ...option })),
    correctAnswer: question.correctAnswer ?? (question.type === "multiple_choice" ? [] : ""),
    explanation: question.explanation ?? "",
  }));
}

export function AssessmentBuilder({ programs, batches, modules, students, demoMode, assessment, questionsLocked = false }: AssessmentBuilderProps) {
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => initialQuestions(assessment));
  const [expanded, setExpanded] = useState<string>(() => assessment?.questions[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const totalMarks = useMemo(() => questions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0), [questions]);

  function patchQuestion(id: string, patch: Partial<DraftQuestion>) {
    setQuestions((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function changeType(id: string, type: QuestionType) {
    const fresh = newQuestion(type);
    patchQuestion(id, { type, options: fresh.options, correctAnswer: fresh.correctAnswer });
  }

  function patchOption(questionId: string, optionId: string, text: string) {
    setQuestions((items) => items.map((item) => item.id === questionId
      ? { ...item, options: item.options.map((option) => option.id === optionId ? { ...option, text } : option) }
      : item));
  }

  function addQuestion() {
    const question = newQuestion();
    setQuestions((items) => [...items, question]);
    setExpanded(question.id);
  }

  function duplicateQuestion(question: DraftQuestion) {
    const copy = { ...question, id: crypto.randomUUID(), options: question.options.map((option) => ({ ...option, id: crypto.randomUUID() })) };
    setQuestions((items) => [...items, copy]);
    setExpanded(copy.id);
  }

  async function save(formData: FormData) {
    setSaving(true);
    setMessage("");
    const delivery = String(formData.get("delivery") ?? "online");
    const timing = String(formData.get("timing") ?? "flexible");
    const durationMinutes = Number(formData.get("durationMinutes") || 0) || null;
    const startsAt = colomboLocalToIso(formData.get("startsAt"));
    const endsAt = colomboLocalToIso(formData.get("endsAt"));
    const isOffline = delivery === "offline";
    const payload = {
      assessmentId: assessment?.id,
      title: formData.get("title"), description: formData.get("description"), instructions: formData.get("instructions"),
      delivery, timing, source: formData.get("source"), status: formData.get("status"), durationMinutes: isOffline ? null : durationMinutes,
      startsAt: isOffline ? null : startsAt, endsAt: isOffline ? null : endsAt,
      maxAttempts: Number(formData.get("maxAttempts") || 1), shuffleQuestions: formData.get("shuffleQuestions") === "on",
      shuffleOptions: formData.get("shuffleOptions") === "on", showAnswers: formData.get("showAnswers") === "on",
      showResults: formData.get("showResults") === "on", access: formData.get("access"), moduleId: formData.get("moduleId") || null,
      programIds: formData.getAll("programIds"), batchIds: formData.getAll("batchIds"), studentIds: formData.getAll("studentIds"),
      questions: isOffline ? [] : questions,
      totalMarks: isOffline ? Number(formData.get("offlineTotalMarks") || 100) : totalMarks,
    };
    if (!String(payload.title ?? "").trim()) { setMessage("Add an assessment title."); setSaving(false); return; }
    if (payload.access !== "free" && !payload.moduleId) { setMessage("Paid assessments must belong to a monthly module."); setSaving(false); return; }
    if (payload.access !== "free" && !payload.programIds.length && !payload.batchIds.length && !payload.studentIds.length) { setMessage("Choose at least one audience."); setSaving(false); return; }
    if (!isOffline && questions.some((question) => !question.prompt.trim())) { setMessage("Every question needs a prompt."); setSaving(false); return; }
    if (!isOffline && timing === "flexible" && !durationMinutes) { setMessage("Flexible assessments need a duration."); setSaving(false); return; }
    if (!isOffline && timing === "strict" && (!startsAt || !endsAt || Date.parse(endsAt) <= Date.parse(startsAt))) { setMessage("Set a valid start time and a later end time."); setSaving(false); return; }
    if (isOffline && (!Number.isFinite(payload.totalMarks) || payload.totalMarks <= 0)) { setMessage("Enter valid total marks."); setSaving(false); return; }
    if (demoMode) { setMessage("Database configuration is required to save this assessment."); setSaving(false); return; }

    try {
      const response = await fetch("/api/admin/assessments", {
        method: assessment ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save assessment.");
      window.location.href = "/adminrandinu/assessments";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save assessment.");
      setSaving(false);
    }
  }

  return (
    <form action={save} className="assessment-builder">
      <div className="builder-topbar">
        <Link href="/adminrandinu/assessments" className="back-link"><ArrowLeft size={16} />Back to assessments</Link>
        <div><span>{questions.length} questions</span><strong>{totalMarks} marks</strong><button className="button button-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}Save changes</button></div>
      </div>
      {message && <p className="form-message">{message}</p>}

      <section className="builder-card">
        <div className="card-heading-row"><div><span className="section-kicker">ASSESSMENT DETAILS</span><h2>Paper settings</h2></div></div>
        <div className="admin-form-grid">
          <label className="field full"><span>Title</span><input name="title" required defaultValue={assessment?.title} /></label>
          <label className="field full"><span>Description</span><textarea name="description" rows={3} defaultValue={assessment?.description} /></label>
          <label className="field full"><span>Instructions</span><textarea name="instructions" rows={3} defaultValue={assessment?.instructions || "Answer every question. Review your answers before submitting."} /></label>
          <label className="field"><span>Delivery</span><select name="delivery" defaultValue={assessment?.delivery ?? "online"}><option value="online">Online assessment</option><option value="offline">Offline mark record</option></select></label>
          <label className="field"><span>Timing</span><select name="timing" defaultValue={assessment?.timing ?? "flexible"}><option value="flexible">Flexible - timed after opening</option><option value="strict">Strict - fixed start and end</option></select></label>
          <label className="field"><span>Source</span><select name="source" defaultValue={assessment?.source ?? "smart_ict"}><option value="smart_ict">Smart ICT</option><option value="school">School examination</option></select></label>
          <label className="field"><span>Status</span><select name="status" defaultValue={assessment?.status ?? "published"}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option><option value="archived">Archived</option></select></label>
          <label className="field"><span>Duration (minutes)</span><input name="durationMinutes" type="number" min="1" max="360" defaultValue={assessment?.durationMinutes ?? 30} /></label>
          <label className="field"><span>Offline total marks</span><input name="offlineTotalMarks" type="number" min="1" step="0.5" defaultValue={assessment?.totalMarks ?? 100} /></label>
          <label className="field"><span>Starts at</span><input name="startsAt" type="datetime-local" defaultValue={isoToColomboLocal(assessment?.startsAt)} /></label>
          <label className="field"><span>Ends at</span><input name="endsAt" type="datetime-local" defaultValue={isoToColomboLocal(assessment?.endsAt)} /></label>
          <label className="field"><span>Maximum attempts</span><input name="maxAttempts" type="number" min="1" max="10" defaultValue={assessment?.maxAttempts ?? 1} /></label>
          <label className="field"><span>Access</span><select name="access" defaultValue={assessment?.access ?? "paid"}><option value="free">Free</option><option value="paid">Paid</option></select></label>
          <label className="field"><span>Monthly module</span><select name="moduleId" defaultValue={assessment?.moduleId ?? ""}><option value="">Independent</option>{modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</select></label>
          <label className="field full"><span>Programs</span><select name="programIds" multiple size={Math.min(Math.max(programs.length, 2), 5)} defaultValue={assessment?.programIds}>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
          <label className="field full"><span>Batches</span><select name="batchIds" multiple size={Math.min(Math.max(batches.length, 2), 5)} defaultValue={assessment?.batchIds}>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label>
          <label className="field full"><span>Individual students</span><select name="studentIds" multiple size={Math.min(Math.max(students.length, 3), 7)} defaultValue={assessment?.studentIds}>{students.map((student) => <option key={student.id} value={student.id}>{student.fullName} - {student.phone}</option>)}</select></label>
          <div className="builder-checkboxes full"><label><input name="shuffleQuestions" type="checkbox" defaultChecked={assessment?.shuffleQuestions} />Shuffle questions</label><label><input name="shuffleOptions" type="checkbox" defaultChecked={assessment?.shuffleOptions} />Shuffle options</label><label><input name="showResults" type="checkbox" defaultChecked={assessment?.showResults ?? true} />Show marks</label><label><input name="showAnswers" type="checkbox" defaultChecked={assessment?.showAnswers} />Show answers</label></div>
        </div>
      </section>

      <section className="builder-questions">
        <div className="dashboard-section-row"><div><span className="section-kicker">QUESTION BUILDER</span><h2>{questionsLocked ? "Questions locked after student attempts" : "Questions"}</h2></div>{!questionsLocked && <button type="button" className="button button-outline" onClick={addQuestion}><CirclePlus size={17} />Add question</button>}</div>
        {questions.map((question, index) => (
          <article className="builder-question" key={question.id}>
            <header>
              <button type="button" className="question-expand" onClick={() => setExpanded(expanded === question.id ? "" : question.id)}><span>Question {index + 1}</span><strong>{question.prompt || "Untitled question"}</strong>{expanded === question.id ? <ChevronUp /> : <ChevronDown />}</button>
              {!questionsLocked && <div><button type="button" onClick={() => duplicateQuestion(question)} title="Duplicate"><Copy size={16} /></button><button type="button" onClick={() => setQuestions((items) => items.filter((item) => item.id !== question.id))} title="Delete" disabled={questions.length === 1}><Trash2 size={16} /></button></div>}
            </header>
            {expanded === question.id && <div className="builder-question-body">
              <div className="admin-form-grid">
                <label className="field"><span>Question type</span><select disabled={questionsLocked} value={question.type} onChange={(event) => changeType(question.id, event.target.value as QuestionType)}><option value="single_choice">Single-answer MCQ</option><option value="multiple_choice">Multiple-answer MCQ</option><option value="true_false">True / False</option><option value="short_answer">Short answer</option><option value="structured">Structured answer</option></select></label>
                <label className="field"><span>Marks</span><input disabled={questionsLocked} type="number" min="0.5" step="0.5" value={question.marks} onChange={(event) => patchQuestion(question.id, { marks: Number(event.target.value) })} /></label>
                <label className="field full"><span>Prompt</span><textarea disabled={questionsLocked} rows={3} value={question.prompt} onChange={(event) => patchQuestion(question.id, { prompt: event.target.value })} /></label>
              </div>
              {["single_choice", "multiple_choice", "true_false"].includes(question.type) && <div className="option-builder">{question.options.map((option) => {
                const correct = Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(option.key) : question.correctAnswer === option.key;
                return <div key={option.id}><button type="button" disabled={questionsLocked} className={correct ? "correct" : ""} onClick={() => {
                  if (question.type === "multiple_choice") {
                    const current = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                    patchQuestion(question.id, { correctAnswer: current.includes(option.key) ? current.filter((item) => item !== option.key) : [...current, option.key] });
                  } else patchQuestion(question.id, { correctAnswer: option.key });
                }}><Check size={15} />{option.key}</button><input disabled={questionsLocked || question.type === "true_false"} value={option.text} onChange={(event) => patchOption(question.id, option.id, event.target.value)} /></div>;
              })}</div>}
              {question.type === "short_answer" && <label className="field"><span>Expected answer</span><input disabled={questionsLocked} value={typeof question.correctAnswer === "string" ? question.correctAnswer : ""} onChange={(event) => patchQuestion(question.id, { correctAnswer: event.target.value })} /></label>}
              <label className="field"><span>Question image URL</span><input disabled={questionsLocked} type="url" value={question.imageUrl} onChange={(event) => patchQuestion(question.id, { imageUrl: event.target.value })} /></label>
              <label className="field"><span>Explanation or marking guidance</span><textarea disabled={questionsLocked} rows={3} value={question.explanation} onChange={(event) => patchQuestion(question.id, { explanation: event.target.value })} /></label>
            </div>}
          </article>
        ))}
        {!questionsLocked && <button type="button" className="button button-outline button-full add-question-bottom" onClick={addQuestion}><CirclePlus size={17} />Add another question</button>}
      </section>
    </form>
  );
}
