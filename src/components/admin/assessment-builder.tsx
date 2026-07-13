"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronUp, CirclePlus, Copy, LoaderCircle, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Batch, ModuleItem, Program, QuestionType, StudentProfile } from "@/lib/types";

function colomboLocalToIso(value: FormDataEntryValue | null) {
  const input = String(value ?? "").trim();
  if (!input || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) return null;
  const parsed = new Date(`${input}:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

type DraftOption = { id: string; key: string; text: string };
type DraftQuestion = { id: string; type: QuestionType; prompt: string; marks: number; imageUrl: string; options: DraftOption[]; correctAnswer: string | string[]; explanation: string };

function newQuestion(type: QuestionType = "single_choice"): DraftQuestion {
  const options = type === "true_false" ? [{id:crypto.randomUUID(),key:"True",text:"True"},{id:crypto.randomUUID(),key:"False",text:"False"}] : ["A","B","C","D"].map((key)=>({id:crypto.randomUUID(),key,text:""}));
  return { id: crypto.randomUUID(), type, prompt: "", marks: 1, imageUrl: "", options, correctAnswer: type === "multiple_choice" ? [] : "", explanation: "" };
}

export function AssessmentBuilder({ programs, batches, modules, students, demoMode }: { programs: Program[]; batches: Batch[]; modules: ModuleItem[]; students: StudentProfile[]; demoMode: boolean }) {
  const [questions,setQuestions]=useState<DraftQuestion[]>([newQuestion()]);
  const [expanded,setExpanded]=useState<string>(questions[0].id);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const totalMarks=useMemo(()=>questions.reduce((sum,q)=>sum+(Number(q.marks)||0),0),[questions]);

  function patch(id:string, patch:Partial<DraftQuestion>){setQuestions((items)=>items.map((item)=>item.id===id?{...item,...patch}:item))}
  function changeType(id:string,type:QuestionType){const current=questions.find((item)=>item.id===id);if(!current)return;const fresh=newQuestion(type);patch(id,{type,options:fresh.options,correctAnswer:fresh.correctAnswer})}
  function patchOption(questionId:string,optionId:string,text:string){setQuestions((items)=>items.map((item)=>item.id===questionId?{...item,options:item.options.map((option)=>option.id===optionId?{...option,text}:option)}:item))}
  function addQuestion(){const question=newQuestion();setQuestions((items)=>[...items,question]);setExpanded(question.id)}
  function duplicateQuestion(question:DraftQuestion){const copy={...question,id:crypto.randomUUID(),options:question.options.map((option)=>({...option,id:crypto.randomUUID()}))};setQuestions((items)=>[...items,copy]);setExpanded(copy.id)}

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
      title: formData.get("title"), description: formData.get("description"), instructions: formData.get("instructions"),
      delivery, timing, source: formData.get("source"), durationMinutes: isOffline ? null : durationMinutes,
      startsAt: isOffline ? null : startsAt, endsAt: isOffline ? null : endsAt,
      maxAttempts: Number(formData.get("maxAttempts") || 1), shuffleQuestions: formData.get("shuffleQuestions") === "on",
      shuffleOptions: formData.get("shuffleOptions") === "on", showAnswers: formData.get("showAnswers") === "on",
      showResults: formData.get("showResults") === "on", access: formData.get("access"), moduleId: formData.get("moduleId") || null,
      programIds: formData.getAll("programIds"), batchIds: formData.getAll("batchIds"), studentIds: formData.getAll("studentIds"),
      questions: isOffline ? [] : questions,
      totalMarks: isOffline ? Number(formData.get("offlineTotalMarks") || 100) : totalMarks,
    };
    if (!payload.title) { setMessage("Add an assessment title."); setSaving(false); return; }
    if (payload.access !== "free" && !payload.programIds.length && !payload.batchIds.length && !payload.studentIds.length) {
      setMessage("Paid assessments need at least one program, batch or individual student audience."); setSaving(false); return;
    }
    if (!isOffline && questions.some((question) => !question.prompt.trim())) { setMessage("Every online question needs a prompt."); setSaving(false); return; }
    if (!isOffline && timing === "flexible" && !durationMinutes) { setMessage("Flexible assessments need a duration."); setSaving(false); return; }
    if (!isOffline && timing === "strict" && (!startsAt || !endsAt)) { setMessage("Strict assessments need both a start and end time."); setSaving(false); return; }
    if (!isOffline && timing === "strict" && Date.parse(String(endsAt)) <= Date.parse(String(startsAt))) { setMessage("The strict assessment end time must be after its start time."); setSaving(false); return; }
    if (isOffline && (!Number.isFinite(payload.totalMarks) || payload.totalMarks <= 0)) { setMessage("Enter a valid total mark for the offline paper."); setSaving(false); return; }
    if (demoMode) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      window.localStorage.setItem(`smartict:admin-assessment:${Date.now()}`, JSON.stringify(payload));
      setMessage("Assessment draft saved in this browser. Configure Supabase to publish it permanently."); setSaving(false); return;
    }
    try {
      const response = await fetch("/api/admin/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save assessment.");
      window.location.href = "/adminrandinu/assessments";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save assessment."); setSaving(false);
    }
  }

  return <form action={save} className="assessment-builder">
    <div className="builder-topbar"><Link href="/adminrandinu/assessments" className="back-link"><ArrowLeft size={16}/>Back to assessments</Link><div><span>{questions.length} question{questions.length===1?"":"s"}</span><strong>{totalMarks} marks</strong><button className="button button-primary" type="submit" disabled={saving}>{saving?<LoaderCircle className="spin" size={17}/>:<Save size={17}/>}Save assessment</button></div></div>
    {message&&<p className="form-message">{message}</p>}
    <section className="builder-card"><div className="card-heading-row"><div><span className="section-kicker">ASSESSMENT DETAILS</span><h2>Set the paper rules</h2></div></div><div className="admin-form-grid">
      <label className="field full"><span>Title</span><input name="title" required placeholder="e.g. July Monthly Paper"/></label>
      <label className="field full"><span>Description</span><textarea name="description" rows={3}/></label>
      <label className="field full"><span>Instructions</span><textarea name="instructions" rows={3} defaultValue="Answer every question. Review your answers before submitting."/></label>
      <label className="field"><span>Delivery</span><select name="delivery" defaultValue="online"><option value="online">Online assessment</option><option value="offline">Offline paper / mark record</option></select></label>
      <label className="field"><span>Timing</span><select name="timing" defaultValue="flexible"><option value="flexible">Flexible — duration starts when opened</option><option value="strict">Strict — fixed start and end time</option></select></label>
      <label className="field"><span>Result source</span><select name="source" defaultValue="smart_ict"><option value="smart_ict">Smart ICT assessment</option><option value="school">School examination</option></select></label>
      <label className="field"><span>Duration (minutes)</span><input name="durationMinutes" type="number" min="1" max="360" defaultValue="30"/><small>Used for flexible online assessments.</small></label><label className="field"><span>Offline paper total marks</span><input name="offlineTotalMarks" type="number" min="1" step="0.5" defaultValue="100"/><small>Used only when delivery is offline.</small></label>
      <label className="field"><span>Starts at</span><input name="startsAt" type="datetime-local"/></label>
      <label className="field"><span>Ends at</span><input name="endsAt" type="datetime-local"/></label>
      <label className="field"><span>Maximum attempts</span><input name="maxAttempts" type="number" min="1" max="10" defaultValue="1"/></label>
      <label className="field"><span>Access</span><select name="access" defaultValue="paid"><option value="free">Free</option><option value="paid">Paid / exclusive</option></select></label>
      <label className="field"><span>Monthly module</span><select name="moduleId" defaultValue=""><option value="">No module / independent</option>{modules.map((module)=><option key={module.id} value={module.id}>{module.title}</option>)}</select></label>
      <label className="field full"><span>Program audiences</span><select name="programIds" multiple size={Math.min(programs.length,5)}>{programs.map((program)=><option key={program.id} value={program.id}>{program.name}</option>)}</select><small>Select one or more programs. Leave this empty only when publishing a free assessment for every registered student.</small></label>
      <label className="field full"><span>Optional batch audiences</span><select name="batchIds" multiple size={Math.min(Math.max(batches.length,2),5)}>{batches.map((batch)=><option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label><label className="field full"><span>Optional individual student audiences</span><select name="studentIds" multiple size={Math.min(Math.max(students.length,3),7)}>{students.map((student)=><option key={student.id} value={student.id}>{student.fullName} · {student.phone}</option>)}</select><small>Use this for a special attempt or a paper assigned only to selected students.</small></label>
      <div className="builder-checkboxes full"><label><input name="shuffleQuestions" type="checkbox"/>Shuffle questions</label><label><input name="shuffleOptions" type="checkbox"/>Shuffle answer options</label><label><input name="showResults" type="checkbox" defaultChecked/>Show marks after release</label><label><input name="showAnswers" type="checkbox"/>Show answer review</label></div>
    </div></section>
    <section className="builder-questions"><div className="dashboard-section-row"><div><span className="section-kicker">QUESTION BUILDER</span><h2>Create the online paper</h2></div><button type="button" className="button button-outline" onClick={addQuestion}><CirclePlus size={17}/>Add question</button></div>
      {questions.map((question,index)=><article className="builder-question" key={question.id}><header><button type="button" className="question-expand" onClick={()=>setExpanded(expanded===question.id?"":question.id)}><span>Question {index+1}</span><strong>{question.prompt||"Untitled question"}</strong>{expanded===question.id?<ChevronUp/>:<ChevronDown/>}</button><div><button type="button" onClick={()=>duplicateQuestion(question)} title="Duplicate"><Copy size={16}/></button><button type="button" onClick={()=>setQuestions((items)=>items.filter((item)=>item.id!==question.id))} title="Delete" disabled={questions.length===1}><Trash2 size={16}/></button></div></header>{expanded===question.id&&<div className="builder-question-body"><div className="admin-form-grid"><label className="field"><span>Question type</span><select value={question.type} onChange={(event)=>changeType(question.id,event.target.value as QuestionType)}><option value="single_choice">Single-answer MCQ</option><option value="multiple_choice">Multiple-answer MCQ</option><option value="true_false">True / False</option><option value="short_answer">Short answer</option><option value="structured">Structured answer</option></select></label><label className="field"><span>Marks</span><input type="number" min="0.5" step="0.5" value={question.marks} onChange={(event)=>patch(question.id,{marks:Number(event.target.value)})}/></label><label className="field full"><span>Question prompt</span><textarea rows={3} value={question.prompt} onChange={(event)=>patch(question.id,{prompt:event.target.value})}/></label></div>
        {(question.type==="single_choice"||question.type==="multiple_choice"||question.type==="true_false")&&<div className="option-builder">{question.options.map((option)=><div key={option.id}><button type="button" className={`${Array.isArray(question.correctAnswer)?question.correctAnswer.includes(option.key):question.correctAnswer===option.key?"correct":""}`} onClick={()=>{if(question.type==="multiple_choice"){const current=Array.isArray(question.correctAnswer)?question.correctAnswer:[];patch(question.id,{correctAnswer:current.includes(option.key)?current.filter((item)=>item!==option.key):[...current,option.key]})}else patch(question.id,{correctAnswer:option.key})}}><Check size={15}/>{option.key}</button><input value={option.text} onChange={(event)=>patchOption(question.id,option.id,event.target.value)} disabled={question.type==="true_false"}/></div>)}</div>}
        {(question.type==="short_answer")&&<label className="field"><span>Expected answer</span><input value={typeof question.correctAnswer==="string"?question.correctAnswer:""} onChange={(event)=>patch(question.id,{correctAnswer:event.target.value})}/></label>}
        <label className="field"><span>Optional question image URL</span><input type="url" placeholder="https://…" value={question.imageUrl} onChange={(event)=>patch(question.id,{imageUrl:event.target.value})}/></label>
        <label className="field"><span>Answer explanation / marking guidance</span><textarea rows={3} value={question.explanation} onChange={(event)=>patch(question.id,{explanation:event.target.value})}/></label>
      </div>}</article>)}
      <button type="button" className="button button-outline button-full add-question-bottom" onClick={addQuestion}><CirclePlus size={17}/>Add another question</button>
    </section>
  </form>
}
