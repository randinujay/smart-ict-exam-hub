"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, Flag, LoaderCircle, Save, Send } from "lucide-react";
import type { Assessment, Question } from "@/lib/types";

interface AssessmentPlayerProps {
  assessment: Assessment;
  demoMode: boolean;
}

type AnswerMap = Record<string, string | string[]>;

function secondsForAssessment(assessment: Assessment) {
  if (assessment.timing === "strict" && assessment.endsAt) {
    return Math.max(0, Math.floor((new Date(assessment.endsAt).getTime() - Date.now()) / 1000));
  }
  return Math.max(60, (assessment.durationMinutes ?? 20) * 60);
}

function formatTime(total: number) {
  const minutes = Math.floor(total / 60).toString().padStart(2, "0");
  const seconds = Math.max(0, total % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function seedFromText(input: string) {
  let seed = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    seed ^= input.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function deterministicShuffle<T>(items: T[], seedText: string) {
  const result = [...items];
  let state = seedFromText(seedText) || 1;
  const random = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function AssessmentPlayer({ assessment: initialAssessment, demoMode }: AssessmentPlayerProps) {
  const router = useRouter();
  const [assessment, setAssessment] = useState(initialAssessment);
  const storageKey = `smartict:assessment:${assessment.id}`;
  const [started, setStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [remaining, setRemaining] = useState(() => secondsForAssessment(assessment));
  const [submitting, setSubmitting] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hasSubmitted = useRef(false);
  const latestAnswers = useRef<AnswerMap>({});
  const latestFlagged = useRef<string[]>([]);
  const latestAttemptId = useRef<string | null>(null);
  const shuffleSeed = attemptId ?? assessment.id;
  const questions = useMemo(
    () => assessment.shuffleQuestions ? deterministicShuffle(assessment.questions, `${shuffleSeed}:questions`) : assessment.questions,
    [assessment.questions, assessment.shuffleQuestions, shuffleSeed],
  );
  const current = questions[currentIndex];
  const displayedOptions = useMemo(
    () => current?.options && assessment.shuffleOptions ? deterministicShuffle(current.options, `${shuffleSeed}:${current.id}:options`) : current?.options,
    [assessment.shuffleOptions, current, shuffleSeed],
  );
  const answeredCount = Object.values(answers).filter((value) => Array.isArray(value) ? value.length : Boolean(value)).length;

  useEffect(() => { latestAnswers.current = answers; }, [answers]);
  useEffect(() => { latestFlagged.current = flagged; }, [flagged]);
  useEffect(() => { latestAttemptId.current = attemptId; }, [attemptId]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { started?: boolean; attemptId?: string; answers?: AnswerMap; flagged?: string[]; currentIndex?: number; deadline?: number };
      if (parsed.started && parsed.attemptId && !demoMode) {
        void resumeAssessment(parsed);
      } else if (parsed.started && demoMode) {
        const restoreTimer = window.setTimeout(() => {
          setStarted(true);
          setAttemptId(parsed.attemptId ?? null);
          setAnswers(parsed.answers ?? {});
          setFlagged(parsed.flagged ?? []);
          setCurrentIndex(parsed.currentIndex ?? 0);
        }, 0);
        return () => window.clearTimeout(restoreTimer);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
    // Restore is intentionally performed once for this assessment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, storageKey]);

  useEffect(() => {
    if (!started || hasSubmitted.current) return;
    const deadline = Date.now() + remaining * 1000;
    window.localStorage.setItem(storageKey, JSON.stringify({ started, attemptId, answers, flagged, currentIndex, deadline }));
  }, [answers, attemptId, currentIndex, flagged, remaining, started, storageKey]);

  useEffect(() => {
    if (demoMode || !started || !attemptId || hasSubmitted.current) return;
    setSaveStatus("saving");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/attempts/${attemptId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, flagged }),
        });
        setSaveStatus(response.ok ? "saved" : "error");
      } catch {
        setSaveStatus("error");
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [answers, attemptId, demoMode, flagged, started]);

  useEffect(() => {
    if (!started || submitting || hasSubmitted.current) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 2) {
          window.clearInterval(timer);
          queueMicrotask(() => void submitAttempt(true));
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // submitAttempt intentionally uses latest component state through closure updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, submitting]);

  async function startAssessment() {
    if (demoMode) {
      setAttemptId(`demo-${Date.now()}`);
      setStarted(true);
      return;
    }
    setSubmitting(true);
    const response = await fetch(`/api/assessments/${assessment.id}/start`, { method: "POST" });
    const payload = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      alert(payload.error ?? "Could not start this assessment.");
      return;
    }
    if (!payload.assessment?.questions?.length) {
      alert("This assessment does not have online questions yet.");
      return;
    }
    setAssessment(payload.assessment as Assessment);
    setAttemptId(payload.attemptId);
    setAnswers(payload.savedAnswers ?? {});
    setFlagged(payload.flagged ?? []);
    if (payload.deadlineAt) setRemaining(Math.max(0, Math.floor((new Date(payload.deadlineAt).getTime() - Date.now()) / 1000)));
    setStarted(true);
  }

  async function resumeAssessment(parsed: { answers?: AnswerMap; flagged?: string[]; currentIndex?: number; deadline?: number }) {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/assessments/${initialAssessment.id}/start`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.assessment?.questions?.length) {
        window.localStorage.removeItem(storageKey);
        return;
      }
      const restoredAssessment = payload.assessment as Assessment;
      setAssessment(restoredAssessment);
      setAttemptId(payload.attemptId);
      setAnswers({ ...(payload.savedAnswers ?? {}), ...(parsed.answers ?? {}) });
      setFlagged(Array.from(new Set([...(payload.flagged ?? []), ...(parsed.flagged ?? [])])));
      setCurrentIndex(Math.min(parsed.currentIndex ?? 0, Math.max(restoredAssessment.questions.length - 1, 0)));
      if (payload.deadlineAt) setRemaining(Math.max(0, Math.floor((new Date(payload.deadlineAt).getTime() - Date.now()) / 1000)));
      setStarted(true);
    } finally {
      setSubmitting(false);
    }
  }

  function setAnswer(question: Question, value: string) {
    setAnswers((currentAnswers) => {
      if (question.type === "multiple_choice") {
        const existing = Array.isArray(currentAnswers[question.id]) ? currentAnswers[question.id] as string[] : [];
        return { ...currentAnswers, [question.id]: existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value] };
      }
      return { ...currentAnswers, [question.id]: value };
    });
  }

  function toggleFlag() {
    if (!current) return;
    setFlagged((items) => items.includes(current.id) ? items.filter((id) => id !== current.id) : [...items, current.id]);
  }

  async function submitAttempt(auto = false) {
    if (hasSubmitted.current) return;
    const submittedAnswers = latestAnswers.current;
    const submittedFlagged = latestFlagged.current;
    const submittedCount = Object.values(submittedAnswers).filter((value) => Array.isArray(value) ? value.length : Boolean(value)).length;
    if (!auto && submittedCount < questions.length && !window.confirm(`You have answered ${submittedCount} of ${questions.length} questions. Submit anyway?`)) return;
    hasSubmitted.current = true;
    setSubmitting(true);

    if (demoMode) {
      let score = 0;
      for (const question of questions) {
        const answer = submittedAnswers[question.id];
        if (Array.isArray(question.correctAnswer)) {
          const left = Array.isArray(answer) ? [...answer].sort().join("|") : "";
          const right = [...question.correctAnswer].sort().join("|");
          if (left === right) score += question.marks;
        } else if (String(answer ?? "").trim().toLowerCase() === String(question.correctAnswer ?? "").trim().toLowerCase()) {
          score += question.marks;
        }
      }
      const resultId = `demo-result-${assessment.id}`;
      window.localStorage.setItem(`smartict:result:${resultId}`, JSON.stringify({ assessment, answers: submittedAnswers, score, total: assessment.totalMarks, completedAt: new Date().toISOString() }));
      window.localStorage.removeItem(storageKey);
      router.push(`/app/results/${resultId}`);
      return;
    }

    const activeAttemptId = latestAttemptId.current;
    if (!activeAttemptId) {
      hasSubmitted.current = false;
      setSubmitting(false);
      alert("The assessment attempt could not be identified. Reopen the assessment and try again.");
      return;
    }
    const response = await fetch(`/api/attempts/${activeAttemptId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: submittedAnswers, flagged: submittedFlagged, autoSubmitted: auto }),
    });
    const payload = await response.json();
    if (!response.ok) {
      hasSubmitted.current = false;
      setSubmitting(false);
      alert(payload.error ?? "Submission failed. Your saved answers are still available.");
      return;
    }
    window.localStorage.removeItem(storageKey);
    router.push(`/app/results/${payload.resultId}`);
  }

  if (!started) {
    return (
      <section className="assessment-start-card">
        <div className="assessment-start-icon"><ClipboardIcon /></div>
        <span className="section-kicker">READY TO BEGIN</span>
        <h1>{assessment.title}</h1>
        <p>{assessment.description}</p>
        <div className="assessment-start-stats"><span><Clock3 size={19}/><div><small>Time</small><strong>{assessment.durationMinutes ?? "Fixed window"} {assessment.durationMinutes ? "minutes" : ""}</strong></div></span><span><CheckCircle2 size={19}/><div><small>Questions</small><strong>Revealed after start</strong></div></span><span><Save size={19}/><div><small>Saving</small><strong>Secure autosave</strong></div></span></div>
        <div className="assessment-instructions"><strong>Instructions</strong><p>{assessment.instructions}</p>{assessment.timing === "strict" && <p className="strict-warning"><AlertTriangle size={16}/>This is a strictly timed assessment. It ends at the published closing time even if you start late.</p>}</div>
        <button className="button button-primary button-large" onClick={startAssessment} disabled={submitting}>{submitting?<LoaderCircle className="spin" size={18}/>:<ArrowRight size={18}/>}Start assessment</button>
      </section>
    );
  }

  if (!current) return <div className="chart-empty">No questions are available.</div>;

  const selected = answers[current.id];
  return (
    <div className="assessment-player">
      <header className="assessment-player-header">
        <div><span>{assessment.title}</span><strong>Question {currentIndex + 1} of {questions.length}</strong></div>
        <div className={`assessment-timer ${remaining < 120 ? "is-low" : ""}`}><Clock3 size={18}/><span>{formatTime(remaining)}</span><small>{saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Save retry needed" : saveStatus === "saved" ? "Saved" : ""}</small></div>
      </header>
      <div className="assessment-progress"><span style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div>
      <div className="assessment-player-grid">
        <main className="question-panel">
          <div className="question-toolbar"><span>{current.marks} mark{current.marks === 1 ? "" : "s"}</span><button type="button" className={flagged.includes(current.id) ? "is-flagged" : ""} onClick={toggleFlag}><Flag size={16}/>{flagged.includes(current.id) ? "Flagged" : "Flag for review"}</button></div>
          <h2>{current.prompt}</h2>
          {current.imageUrl && <Image src={current.imageUrl} alt="Question reference" width={960} height={540} unoptimized className="question-image"/>}
          {(current.type === "single_choice" || current.type === "multiple_choice" || current.type === "true_false") && <div className="answer-options">{displayedOptions?.map((option) => {const isSelected=Array.isArray(selected)?selected.includes(option.key):selected===option.key;return <button type="button" key={option.id} className={isSelected?"selected":""} onClick={()=>setAnswer(current,option.key)}><span>{option.key}</span><strong>{option.text}</strong>{isSelected&&<CheckCircle2 size={20}/>}</button>})}</div>}
          {(current.type === "short_answer" || current.type === "structured") && <textarea className="structured-answer" rows={current.type === "structured" ? 10 : 4} value={typeof selected === "string" ? selected : ""} onChange={(event)=>setAnswer(current,event.target.value)} placeholder="Type your answer here..." />}
          <div className="question-navigation"><button type="button" className="button button-outline" disabled={currentIndex===0} onClick={()=>setCurrentIndex((index)=>Math.max(0,index-1))}><ArrowLeft size={17}/>Previous</button>{currentIndex===questions.length-1?<button type="button" className="button button-primary" onClick={()=>setShowSubmit(true)}><Send size={17}/>Review & submit</button>:<button type="button" className="button button-primary" onClick={()=>setCurrentIndex((index)=>Math.min(questions.length-1,index+1))}>Save & next<ArrowRight size={17}/></button>}</div>
        </main>
        <aside className="question-navigator"><div><strong>Question navigator</strong><span>{answeredCount}/{questions.length} answered</span></div><div className="question-number-grid">{questions.map((question,index)=>{const hasAnswer=Array.isArray(answers[question.id])?answers[question.id].length>0:Boolean(answers[question.id]);return <button type="button" key={question.id} className={`${index===currentIndex?"current":""} ${hasAnswer?"answered":""} ${flagged.includes(question.id)?"flagged":""}`} onClick={()=>setCurrentIndex(index)}>{index+1}</button>})}</div><div className="navigator-legend"><span><i className="answered"/>Answered</span><span><i className="flagged"/>Flagged</span><span><i/>Not answered</span></div><button className="button button-dark button-full" onClick={()=>setShowSubmit(true)}>Submit assessment</button></aside>
      </div>
      {showSubmit && <div className="modal-backdrop"><section className="submit-modal"><div className="submit-modal-icon"><Send size={25}/></div><h2>Submit your assessment?</h2><p>You answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions and flagged <strong>{flagged.length}</strong>.</p>{answeredCount<questions.length&&<div className="submit-warning"><AlertTriangle size={17}/>Some questions are unanswered.</div>}<div className="submit-modal-actions"><button className="button button-outline" onClick={()=>setShowSubmit(false)} disabled={submitting}>Keep reviewing</button><button className="button button-primary" onClick={()=>void submitAttempt(false)} disabled={submitting}>{submitting?<LoaderCircle className="spin" size={18}/>:<Send size={17}/>}Submit now</button></div></section></div>}
    </div>
  );
}

function ClipboardIcon(){return <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6"/></svg>}
