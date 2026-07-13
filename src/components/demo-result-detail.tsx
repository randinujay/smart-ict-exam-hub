"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, CircleX, Trophy } from "lucide-react";
import type { Assessment } from "@/lib/types";

interface SavedResult {
  assessment: Assessment;
  answers: Record<string, string | string[]>;
  score: number;
  total: number;
  completedAt: string;
}

export function DemoResultDetail({ resultId }: { resultId: string }) {
  const [data, setData] = useState<SavedResult | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(`smartict:result:${resultId}`);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as SavedResult;
      const restoreTimer = window.setTimeout(() => setData(parsed), 0);
      return () => window.clearTimeout(restoreTimer);
    } catch {
      window.localStorage.removeItem(`smartict:result:${resultId}`);
    }
  }, [resultId]);

  if (!data) return <div className="chart-empty">This demo result is not available in this browser.</div>;

  const percentage = data.total ? Math.round((data.score / data.total) * 100) : 0;
  return <div>
    <Link href="/app/results" className="back-link"><ArrowLeft size={16}/>Back to results</Link>
    <section className="result-hero-card">
      <div className="result-score-ring" style={{ background: `conic-gradient(var(--red) ${percentage}%, #ececec 0)` }}>
        <strong>{percentage}%</strong><span>{data.score}/{data.total} marks</span>
      </div>
      <div>
        <span className="section-kicker">ASSESSMENT COMPLETE</span>
        <h1>{data.assessment.title}</h1>
        <p>Submitted {new Date(data.completedAt).toLocaleString("en-LK")}</p>
        <div className="result-summary-badges">
          <span><Trophy size={17}/>Published instantly</span>
          <span><CheckCircle2 size={17}/>{Object.keys(data.answers).length} answered</span>
        </div>
      </div>
    </section>

    {data.assessment.showAnswers && <section className="result-review">
      <div className="dashboard-section-row"><div><span className="section-kicker">ANSWER REVIEW</span><h2>See what happened question by question</h2></div></div>
      {data.assessment.questions.map((question, index) => {
        const answer = data.answers[question.id];
        const correct = Array.isArray(question.correctAnswer)
          ? Array.isArray(answer) && [...answer].sort().join("|") === [...question.correctAnswer].sort().join("|")
          : String(answer ?? "").toLowerCase() === String(question.correctAnswer ?? "").toLowerCase();
        return <article key={question.id} className={correct ? "correct" : "incorrect"}>
          <span>{correct ? <CheckCircle2/> : <CircleX/>}</span>
          <div>
            <small>Question {index + 1} · {question.marks} mark{question.marks === 1 ? "" : "s"}</small>
            <h3>{question.prompt}</h3>
            {question.imageUrl && <Image src={question.imageUrl} alt="Question reference" width={960} height={540} unoptimized className="question-image"/>}
            <p><b>Your answer:</b> {Array.isArray(answer) ? answer.join(", ") : answer || "Not answered"}</p>
            {!correct && <p><b>Correct answer:</b> {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(", ") : question.correctAnswer}</p>}
            {question.explanation && <div className="answer-explanation">{question.explanation}</div>}
          </div>
        </article>;
      })}
    </section>}
  </div>;
}
