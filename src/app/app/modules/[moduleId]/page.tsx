import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardCheck, Download, FileText, LockKeyhole, PlayCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getStudentDashboardData } from "@/lib/data";
import { canOpenAssessment, hasPaidModuleAccess } from "@/lib/access";

export default async function ModuleDetailPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const data = await getStudentDashboardData();
  const monthlyModule = data.modules.find((item) => item.id === moduleId);
  if (!monthlyModule) notFound();

  const unlocked = hasPaidModuleAccess(data.student, monthlyModule, data.payments);
  const moduleAssessments = data.assessments.filter((assessment) => monthlyModule.assessmentIds.includes(assessment.id));

  return <div>
    <Link href="/app/modules" className="back-link"><ArrowLeft size={16}/>Back to modules</Link>
    <section className="module-detail-header">
      <div>
        <span className="section-kicker">MONTHLY MODULE</span>
        <h1>{monthlyModule.title}</h1>
        <p>{data.programs.find((program) => program.id === monthlyModule.programId)?.name ?? "Smart ICT Program"}</p>
      </div>
      {unlocked ? <StatusBadge tone="success">Available</StatusBadge> : <StatusBadge tone="warning">Locked</StatusBadge>}
    </section>

    {!unlocked && <section className="locked-content-panel">
      <LockKeyhole size={30}/>
      <div>
        <h2>This paid module is currently locked.</h2>
        <p>Access requires a verified account, enrolment in the relevant program and batch, and a confirmed payment for this month.</p>
      </div>
      <Link href="/app/payments" className="button button-primary">View payment details</Link>
    </section>}

    {unlocked && <>
      <section className="module-content-section">
        <div className="dashboard-section-row">
          <div><span className="section-kicker">VIDEO RECORDINGS</span><h2>Watch this month’s sessions</h2></div>
          <span>{monthlyModule.recordings.length} recording{monthlyModule.recordings.length === 1 ? "" : "s"}</span>
        </div>
        <div className="recording-grid">
          {monthlyModule.recordings.map((recording) => <article key={recording.id} className="recording-card">
            <div className="recording-thumb"><PlayCircle size={42}/><span>{recording.duration ?? "Video"}</span></div>
            <div>
              <div className="program-tags"><span>{recording.access === "free" ? "FREE" : "MODULE ACCESS"}</span></div>
              <h3>{recording.title}</h3><p>{recording.description}</p>
              <a href={recording.videoUrl} className="button button-dark button-small">Open recording <ArrowRight size={15}/></a>
            </div>
          </article>)}
        </div>
      </section>

      <section className="module-content-section">
        <div className="dashboard-section-row">
          <div><span className="section-kicker">RESOURCES</span><h2>Tutes, PDFs and downloads</h2></div>
          <span>{monthlyModule.resources.length} file{monthlyModule.resources.length === 1 ? "" : "s"}</span>
        </div>
        <div className="resource-list">
          {monthlyModule.resources.map((resource) => <article key={resource.id}>
            <span className="resource-file-icon"><FileText size={22}/></span>
            <div><strong>{resource.title}</strong><p>{resource.description}</p><small>{resource.fileName}</small></div>
            <a href={resource.fileUrl} className="button button-outline button-small"><Download size={15}/>Download</a>
          </article>)}
        </div>
      </section>

      <section className="module-content-section">
        <div className="dashboard-section-row">
          <div><span className="section-kicker">EXAMS & QUIZZES</span><h2>Assessments in this module</h2></div>
          <span>{moduleAssessments.length} assessment{moduleAssessments.length === 1 ? "" : "s"}</span>
        </div>
        <div className="assessment-list">
          {moduleAssessments.map((assessment) => {
            const canOpen = canOpenAssessment(data.student, assessment, monthlyModule, data.payments);
            return <article key={assessment.id}>
              <span className="assessment-list-icon"><ClipboardCheck size={22}/></span>
              <div>
                <div className="program-tags"><span>{assessment.delivery}</span><span>{assessment.timing}</span></div>
                <h3>{assessment.title}</h3><p>{assessment.description}</p>
              </div>
              {canOpen ? <Link href={`/app/assessments/${assessment.id}`} className="button button-primary button-small">Open <ArrowRight size={15}/></Link> : <StatusBadge tone="warning">Locked</StatusBadge>}
            </article>;
          })}
        </div>
      </section>
    </>}
  </div>;
}
