import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Languages,
  Laptop2,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { getPublicPrograms, getTestimonials } from "@/lib/data";
import { BRAND } from "@/lib/config";

const whyItems = [
  { title: "Personalized Guidance", text: "Guidance shaped around the student’s current level, pace and academic journey.", icon: UserRoundCheck },
  { title: "Sinhala & English Medium", text: "Learning support and resources prepared for both Sinhala and English medium students.", icon: Languages },
  { title: "Smart ICT LMS", text: "A connected digital space for modules, resources, assessments, results and progress insights.", icon: Laptop2 },
  { title: "Student-Oriented Teaching", text: "Clear explanations, supportive communication and practical learning experiences.", icon: BookOpenCheck },
  { title: "Exam-Oriented Approach", text: "Structured question practice, paper technique and measurable assessment progress.", icon: Target },
  { title: "Smart Memory & Retention", text: "Recall, repetition and simplified memory methods designed to make knowledge stick.", icon: BrainCircuit },
  { title: "Practical ICT Learning", text: "ICT is taught as something students can understand, apply and use—not merely memorise.", icon: Wrench },
];

export default async function HomePage() {
  const [programs, testimonials] = await Promise.all([getPublicPrograms(), getTestimonials()]);

  return (
    <PublicLayout>
      <main className="public-page home-page">
        <section className="brand-hero">
          <div className="site-shell brand-hero-grid">
            <div className="brand-hero-copy">
              <div className="eyebrow"><Sparkles size={15} /> Randinu Jayaratne | Smart ICT</div>
              <h1>Learn ICT smarter. <span>Build real confidence.</span></h1>
              <p>Structured ICT education with student-oriented teaching, practical learning, smart revision methods and a modern learning platform built around measurable progress.</p>
              <div className="hero-actions">
                <Link href="/programs" className="button button-primary button-large">Explore Programs <ArrowRight size={18} /></Link>
                <Link href="/login" className="button button-ghost button-large">Student Login</Link>
              </div>
              <div className="hero-proof-row">
                <span><CheckCircle2 size={17} /> Sinhala & English Medium</span>
                <span><CheckCircle2 size={17} /> Smart LMS Access</span>
                <span><CheckCircle2 size={17} /> Online & Offline Results</span>
              </div>
            </div>
            <div className="brand-hero-visual">
              <div className="hero-red-orbit" />
              <div className="hero-image-frame">
                <Image src="/randinu-portrait.jpg" alt="Randinu Jayaratne, Smart ICT teacher" width={680} height={740} priority />
              </div>
              <div className="hero-float-card hero-float-top"><ShieldCheck size={18} /><div><strong>Smart ICT LMS</strong><span>One connected learning journey</span></div></div>
              <div className="hero-float-card hero-float-bottom"><BarChart3 size={18} /><div><strong>Progress that makes sense</strong><span>Marks, trends and smart insights</span></div></div>
            </div>
          </div>
        </section>

        <section className="section programs-section" id="programs">
          <div className="site-shell">
            <div className="section-heading split-heading">
              <div><span className="section-kicker">CURRENT PROGRAMS</span><h2>Choose the journey that matches your exam year.</h2></div>
              <p>Programs are managed dynamically inside the Smart ICT platform, so new O/L and A/L offerings can be added as the class grows.</p>
            </div>
            <div className="program-grid">
              {programs.map((program) => (
                <article className="program-card" key={program.id}>
                  <div className="program-image"><Image src={program.image} alt={program.name} width={640} height={640} /></div>
                  <div className="program-card-body">
                    <div className="program-tags"><span>{program.academicLevel}</span><span>{program.medium.join(" + ")}</span></div>
                    <h3>{program.name}</h3>
                    <p>{program.description}</p>
                    <Link href={`/programs/${program.slug}`}>View program <ArrowRight size={16} /></Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section teacher-feature-section">
          <div className="site-shell teacher-feature-grid">
            <div className="teacher-feature-media">
              <div className="teacher-feature-poster"><Image src="/ol-theory-poster.jpg" alt="Smart ICT class poster" width={720} height={720} /></div>
              <div className="teacher-feature-number"><strong>ICT</strong><span>made clearer, smarter and more practical.</span></div>
            </div>
            <div className="teacher-feature-copy">
              <span className="section-kicker">ABOUT THE TEACHER</span>
              <h2>Learning with Randinu Jayaratne</h2>
              <p className="lead">Smart ICT is built around clear communication, student-focused guidance and a genuine interest in helping students understand how ICT works.</p>
              <p>Randinu’s background includes leadership as ICT Society Chairman and Deputy Head Prefect, experience in debating, public speaking, announcing and ICT competitions, together with continuing legal studies and an academic interest in technology, management and digital transformation.</p>
              <div className="teacher-qualification-row">
                <span>Dip. in Law (Reading)</span>
                <span>Expecting University Entrance</span>
              </div>
              <Link href="/about" className="button button-dark">Read the full story <ArrowRight size={17} /></Link>
            </div>
          </div>
        </section>

        <section className="section why-section">
          <div className="site-shell">
            <div className="section-heading centered-heading"><span className="section-kicker">WHY SMART ICT</span><h2>A smarter class is more than a video and a PDF.</h2><p>The teaching approach, digital system and assessment workflow are designed to work together.</p></div>
            <div className="why-grid">
              {whyItems.map(({ title, text, icon: Icon }) => (
                <article key={title} className="why-card"><span className="why-icon"><Icon size={22} /></span><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="section lms-showcase-section">
          <div className="site-shell lms-showcase-shell">
            <div className="lms-showcase-copy">
              <span className="section-kicker light">THE SMART ICT LMS</span>
              <h2>Your class, resources, assessments and progress—connected.</h2>
              <p>The LMS is not a side feature. It is the digital centre of the Smart ICT learning journey, with free access for every registered student and paid monthly content unlocked according to their program and payment status.</p>
              <div className="lms-feature-list">
                <span><PlayCircle size={18} /> Monthly modules and recordings</span>
                <span><Download size={18} /> Tutes, PDFs and printable resources</span>
                <span><ClipboardCheck size={18} /> Secure quizzes and examinations</span>
                <span><BarChart3 size={18} /> Smart ICT and school-mark progress graphs</span>
              </div>
              <Link href="/smart-lms" className="button button-light">Explore the LMS <ArrowRight size={17} /></Link>
            </div>
            <div className="lms-device-stage" aria-label="Smart ICT LMS dashboard preview">
              <div className="lms-browser">
                <div className="lms-browser-bar"><i /><i /><i /><span>Smart ICT LMS · Student Dashboard</span></div>
                <div className="lms-preview-body">
                  <div className="lms-preview-sidebar"><b>S</b><span /><span /><span /><span /></div>
                  <div className="lms-preview-main">
                    <div className="lms-preview-welcome"><div><small>GOOD MORNING</small><strong>Welcome back, Nethmi 👋</strong></div><em>Verified</em></div>
                    <div className="lms-preview-stats"><span><small>Latest mark</small><strong>71%</strong></span><span><small>Average</small><strong>60%</strong></span><span><small>Modules</small><strong>03</strong></span></div>
                    <div className="lms-preview-chart"><div className="fake-line"><i /><i /><i /><i /></div></div>
                    <div className="lms-preview-bottom"><span><b>Smart Insight</b><small>Your last three papers show positive momentum.</small></span><span><b>July Module</b><small>2 recordings · 2 resources</small></span></div>
                  </div>
                </div>
              </div>
              <div className="lms-phone"><div className="phone-notch" /><b>71%</b><span>Latest mark</span><div className="phone-mini-chart" /></div>
            </div>
          </div>
        </section>

        <section className="section results-testimonials-section">
          <div className="site-shell">
            <div className="section-heading split-heading"><div><span className="section-kicker">RESULTS & EXPERIENCES</span><h2>Real progress deserves to be seen.</h2></div><p>As Smart ICT grows, this space can showcase verified mark improvements, examination results and student experiences managed from the admin dashboard.</p></div>
            <div className="testimonial-grid">
              {testimonials.map((item) => (
                <blockquote key={item.id} className="testimonial-card">
                  <div className="quote-mark">“</div>
                  <p>{item.quote}</p>
                  <footer><div><strong>{item.studentName}</strong><span>{item.programName}</span></div>{item.resultLabel && <em>{item.resultLabel}</em>}</footer>
                </blockquote>
              ))}
            </div>
            <div className="results-cta"><div><strong>Already a Smart ICT student?</strong><span>Open your dashboard to see modules, results and insights.</span></div><Link href="/login" className="button button-primary">Open Student LMS <ArrowRight size={17} /></Link></div>
          </div>
        </section>

        <section className="section faq-preview-section">
          <div className="site-shell faq-preview-grid">
            <div><span className="section-kicker">FREQUENTLY ASKED QUESTIONS</span><h2>Before you join, here are the essentials.</h2><p>Learn how registration, account verification, monthly access and the Smart ICT LMS work.</p><Link href="/faq" className="button button-outline">View all questions</Link></div>
            <div className="faq-mini-list">
              <details open><summary>How do students access the Smart ICT LMS?</summary><p>Create an account with a phone number and password. Free content is available immediately, while paid class content is unlocked after admin verification and monthly payment confirmation.</p></details>
              <details><summary>Are Sinhala and English Medium supported?</summary><p>Yes. Programs and resources can be made available in Sinhala, English or both mediums.</p></details>
              <details><summary>How are class payments confirmed?</summary><p>Payments are made using the bank details in the LMS. Receipts are sent through WhatsApp, and access is updated manually by the administrator.</p></details>
            </div>
          </div>
        </section>

        <section className="contact-band">
          <div className="site-shell contact-band-inner">
            <div><span>READY TO GET STARTED?</span><h2>Join the Smart ICT learning journey.</h2></div>
            <div className="contact-band-actions"><a href={BRAND.socials.whatsapp} target="_blank" rel="noreferrer" className="button button-light"><MessageCircle size={18} /> WhatsApp {BRAND.phoneDisplay}</a><Link href="/register" className="button button-outline-light">Create LMS Account</Link></div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
