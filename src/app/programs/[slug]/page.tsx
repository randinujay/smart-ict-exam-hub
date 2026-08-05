import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart3, BookOpenCheck, CheckCircle2, Files, Laptop2 } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { getProgramBySlug } from "@/lib/data";
import { BRAND } from "@/lib/config";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  return { title: program?.name ?? "Program", description: program?.description };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) notFound();
  return (
    <PublicLayout>
      <main className="public-page inner-public-page">
        <section className="program-detail-hero">
          <div className="site-shell program-detail-grid">
            <div className="program-detail-copy"><span className="section-kicker">{program.academicLevel} ICT PROGRAM</span><h1>{program.name}</h1><p>{program.description}</p><div className="hero-actions"><Link href="/register" className="button button-primary button-large">Create LMS Account <ArrowRight size={18} /></Link><a href={BRAND.socials.whatsapp} target="_blank" rel="noreferrer" className="button button-ghost button-large">Ask on WhatsApp</a></div></div>
            <div className="program-detail-image"><Image src={program.image} alt={program.name} width={760} height={760} priority /></div>
          </div>
        </section>
        <section className="section">
          <div className="site-shell">
            <div className="section-heading centered-heading"><span className="section-kicker">WHAT STUDENTS RECEIVE</span><h2>A complete learning system around the class.</h2></div>
            <div className="four-feature-grid">
              <article><BookOpenCheck /><h3>Clear Teaching</h3><p>Concepts explained through a student-oriented and practical approach.</p></article>
              <article><Laptop2 /><h3>Monthly Modules</h3><p>Recordings, resources and assessments organised by month inside the LMS.</p></article>
              <article><Files /><h3>Smart Resources</h3><p>Tutes, PDF notes, model papers and downloadable revision materials.</p></article>
              <article><BarChart3 /><h3>Progress Analytics</h3><p>Smart ICT marks, school-term marks and useful data-based insights.</p></article>
            </div>
          </div>
        </section>
        <section className="section soft-section">
          <div className="site-shell two-column-content"><div><span className="section-kicker">PROGRAM ACCESS</span><h2>How the LMS access works</h2><p>Every registered student can enter the dashboard and use free content. Paid monthly modules are unlocked after account verification and payment confirmation for the relevant program.</p></div><div className="access-steps"><span><b>01</b><div><strong>Create your account</strong><p>Register using your phone number and student details.</p></div></span><span><b>02</b><div><strong>Get verified</strong><p>The Smart ICT admin reviews and activates your student account.</p></div></span><span><b>03</b><div><strong>Access monthly content</strong><p>Relevant paid modules unlock after monthly payment is marked.</p></div></span></div></div>
        </section>
        <section className="program-final-cta"><div className="site-shell"><CheckCircle2 size={28} /><div><h2>Ready to join {program.shortName}?</h2><p>Create your LMS account or message Smart ICT for enrolment details.</p></div><Link href="/register" className="button button-light">Get started <ArrowRight size={17} /></Link></div></section>
      </main>
    </PublicLayout>
  );
}
