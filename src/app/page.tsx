import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpenCheck, BrainCircuit, ClipboardCheck, Download, Languages, Laptop2, MessageCircle, PlayCircle, Sparkles, Target, UserRoundCheck, Wrench } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { BRAND } from "@/lib/config";
import { getLatestClasses, getPublicPrograms, getPublicSiteContent, getTestimonials } from "@/lib/data";
import { PUBLIC_CONTENT_DEFAULTS } from "@/lib/site-content";

export const dynamic = "force-dynamic";

const whyItems = [
  { title: "Personalized guidance", text: "Support matched to each student's level and pace.", icon: UserRoundCheck },
  { title: "Sinhala & English", text: "Learning support for both teaching mediums.", icon: Languages },
  { title: "Connected LMS", text: "Modules, tests, results and resources in one place.", icon: Laptop2 },
  { title: "Student-focused teaching", text: "Clear explanations and practical learning.", icon: BookOpenCheck },
  { title: "Exam preparation", text: "Question practice, paper technique and progress tracking.", icon: Target },
  { title: "Better retention", text: "Revision methods designed to make knowledge stick.", icon: BrainCircuit },
  { title: "Practical ICT", text: "Understand and apply ICT instead of memorising it.", icon: Wrench },
];

export default async function HomePage() {
  const [programs, classes, testimonials, publicContent] = await Promise.all([getPublicPrograms(), getLatestClasses(), getTestimonials(), getPublicSiteContent()]);
  const content = { ...PUBLIC_CONTENT_DEFAULTS, ...publicContent };
  return <PublicLayout><main className="public-page home-page">
    <section className="brand-hero" id="home"><div className="site-shell brand-hero-grid">
      <div className="brand-hero-copy"><div className="eyebrow"><Sparkles size={15} />{content.hero_eyebrow}</div><h1>{content.hero_title} <span>{content.hero_highlight}</span></h1><div className="hero-actions"><Link href="/#classes" className="button button-primary button-large">Explore classes <ArrowRight size={18} /></Link><Link href="/login" className="button button-outline-light button-large">Student login</Link></div></div>
    </div></section>

    <section className="section programs-section" id="classes"><div className="site-shell"><div className="section-heading"><span className="section-kicker">LATEST CLASSES</span><h2>Find your Smart ICT class.</h2></div><div className="class-card-grid">{classes.map((item, index) => {
      const program = programs.find((entry) => entry.id === item.programId);
      return <article className={`public-class-card class-tone-${index % 3}`} key={item.id}>
        <div className="class-text-thumbnail" role="img" aria-label={`${item.className} class thumbnail`}>
          <span>SMART ICT</span><strong>{item.name}</strong><b>{program?.name ?? "ICT"}</b><small>CLASS</small>
        </div>
        <div className="public-class-card-body"><span>{item.name}</span><h3>{program?.name ?? "ICT"} Class</h3></div>
      </article>;
    })}</div></div></section>

    <section className="section teacher-feature-section" id="about"><div className="site-shell teacher-feature-grid"><div className="teacher-feature-media"><div className="teacher-feature-poster"><Image src={content.about_image_url} alt="Randinu Jayaratne" width={720} height={900} unoptimized /></div></div><div className="teacher-feature-copy"><span className="section-kicker light">{content.about_kicker}</span><h2>{content.about_title}</h2><p className="lead">{content.about_lead}</p><p>{content.about_body}</p></div></div></section>

    <section className="section why-section" id="why-smart-ict"><div className="site-shell"><div className="section-heading centered-heading"><span className="section-kicker">{content.why_kicker}</span><h2>{content.why_title}</h2></div><div className="why-grid">{whyItems.map(({ title, icon: Icon }) => <article key={title} className="why-card"><span className="why-icon"><Icon size={22} /></span><h3>{title}</h3></article>)}</div></div></section>

    <section className="section lms-showcase-section" id="smart-lms"><div className="site-shell lms-showcase-shell"><div className="lms-showcase-copy"><span className="section-kicker light">{content.lms_kicker}</span><h2>{content.lms_title}</h2><p>{content.lms_description}</p><div className="lms-feature-list"><span><PlayCircle size={18} />Monthly modules and recordings</span><span><Download size={18} />Tutes and downloadable resources</span><span><ClipboardCheck size={18} />Flexible and strictly timed tests</span><span><BarChart3 size={18} />Progress and results</span></div><Link href="/register" className="button button-light">Create student account <ArrowRight size={17} /></Link></div><div className="lms-device-stage" aria-label="Illustrative preview of the Smart ICT LMS student dashboard, not real student data"><div className="lms-browser"><div className="lms-browser-bar"><i /><i /><i /><span>Smart ICT LMS</span><b className="lms-preview-tag">Sample preview</b></div><div className="lms-preview-body"><div className="lms-preview-sidebar"><b>S</b><span /><span /><span /><span /></div><div className="lms-preview-main"><div className="lms-preview-welcome"><div><small>WELCOME</small><strong>Student dashboard</strong></div><em>Verified</em></div><div className="lms-preview-stats"><span><small>Latest mark</small><strong>71%</strong></span><span><small>Average</small><strong>60%</strong></span><span><small>Modules</small><strong>03</strong></span></div><div className="lms-preview-chart"><div className="fake-line"><i /><i /><i /><i /></div></div><p className="lms-preview-disclaimer">Sample data for illustration - not a real student account.</p></div></div></div></div></div></section>

    <section className="section reviews-section" id="reviews"><div className="site-shell"><div className="section-heading reviews-heading"><span className="section-kicker light">{content.reviews_kicker}</span><h2>{content.reviews_title}</h2></div>{testimonials.length ? <div className="testimonial-grid">{testimonials.map((item) => <blockquote key={item.id} className="testimonial-card"><p>{item.quote}</p><footer><div><strong>{item.studentName}</strong><span>{item.programName}</span></div>{item.resultLabel && <em>{item.resultLabel}</em>}</footer></blockquote>)}</div> : <div className="reviews-empty-state"><MessageCircle size={26} /><strong>Reviews will appear here after teacher approval.</strong></div>}</div></section>

    <section className="section faq-preview-section" id="faq"><div className="site-shell faq-preview-grid"><div><span className="section-kicker">{content.faq_kicker}</span><h2>{content.faq_title}</h2><Link href="/faq" className="button button-outline">View questions</Link></div><div className="faq-mini-list"><details open><summary>How do students access the LMS?</summary><p>Register with a Sri Lankan mobile number. Access is enabled after teacher verification.</p></details><details><summary>How much do classes cost?</summary><p>Fees vary by program - message Smart ICT on WhatsApp at {BRAND.phoneDisplay} for current pricing.</p></details><details><summary>Are both mediums supported?</summary><p>Yes, Sinhala and English medium are supported.</p></details><details><summary>How are payments confirmed?</summary><p>Send the receipt through WhatsApp. The teacher updates access after checking it.</p></details></div></div></section>

    <section className="contact-band" id="contact"><div className="site-shell contact-band-inner"><div><span>{content.contact_kicker}</span><h2>{content.contact_title}</h2></div><div className="contact-band-actions"><a href={BRAND.socials.whatsapp} target="_blank" rel="noreferrer" className="button button-light"><MessageCircle size={18} />WhatsApp {BRAND.phoneDisplay}</a><Link href="/register" className="button button-outline-light">Create LMS account</Link></div></div></section>
  </main></PublicLayout>;
}
