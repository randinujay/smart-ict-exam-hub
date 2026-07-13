import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardCheck, Files, Layers3, LockKeyhole, Sparkles, UserRoundCheck } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";

export const metadata: Metadata = { title: "Smart ICT LMS", description: "Explore the Smart ICT learning management system." };

export default function SmartLmsPage() {
  return (
    <PublicLayout>
      <main className="public-page inner-public-page">
        <section className="lms-product-hero"><div className="site-shell"><div className="eyebrow dark-eyebrow"><Sparkles size={15} /> Smart ICT digital learning experience</div><h1>The LMS is the <span>centre of the journey.</span></h1><p>Monthly learning content, downloadable resources, secure assessments, online and offline results, payment status and data-based insights—inside one student dashboard.</p><div className="hero-actions"><Link href="/register" className="button button-light button-large">Create free account <ArrowRight size={18} /></Link><Link href="/login" className="button button-outline-light button-large">Student login</Link></div></div></section>
        <section className="section"><div className="site-shell lms-feature-detail-grid">
          <article><span><Layers3 /></span><h2>Monthly Modules</h2><p>Each batch is organised into monthly modules. A module can contain recordings, PDF resources, tutes, quizzes and examinations without forcing the content into artificial lesson-completion rules.</p></article>
          <article><span><Files /></span><h2>Free & Paid Resources</h2><p>Every registered student can access free content. Paid resources unlock according to program, batch, month and payment confirmation.</p></article>
          <article><span><ClipboardCheck /></span><h2>Online & Offline Assessments</h2><p>Take timed online assessments or receive uploaded marks from physical papers and school examinations in the same results system.</p></article>
          <article><span><BarChart3 /></span><h2>Clear Progress Graphs</h2><p>Smart ICT assessment progress and school-term marks appear separately so students can understand both journeys.</p></article>
          <article><span><UserRoundCheck /></span><h2>Manual Account Verification</h2><p>New users enter the dashboard immediately, while exclusive content stays protected until an administrator verifies the account.</p></article>
          <article><span><LockKeyhole /></span><h2>Precise Access Control</h2><p>Content can be assigned to a program, batch, month, another selected program or even one individual student.</p></article>
        </div></section>
        <section className="section soft-section"><div className="site-shell dashboard-explainer"><div><span className="section-kicker">THE STUDENT DASHBOARD</span><h2>Useful information first—not dashboard decoration.</h2><p>The main dashboard answers what matters: what is available now, how marks are changing, what the account can access and what the student should open next.</p><ul><li>Personal greeting and account status</li><li>Smart ICT marks progression</li><li>School-term marks progression</li><li>Real data-based Smart Insights</li><li>Recent resources and available assessments</li><li>Monthly module overview and payment status</li></ul></div><div className="dashboard-wireframe"><div className="wire-top"/><div className="wire-cards"><i/><i/><i/></div><div className="wire-chart"/><div className="wire-bottom"><i/><i/></div></div></div></section>
      </main>
    </PublicLayout>
  );
}
