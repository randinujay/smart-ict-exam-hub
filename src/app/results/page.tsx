import type { Metadata } from "next";
import { ArrowRight, ChartNoAxesCombined, MessageSquareQuote, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PublicLayout } from "@/components/public-layout";
import { getTestimonials } from "@/lib/data";

export const metadata: Metadata = { title: "Results & Testimonials", description: "Smart ICT student progress and experiences." };

export default async function ResultsPage() {
  const testimonials = await getTestimonials();
  return (
    <PublicLayout><main className="public-page inner-public-page"><section className="inner-hero"><div className="site-shell inner-hero-grid"><div><span className="section-kicker">RESULTS & EXPERIENCES</span><h1>Progress should be documented—not guessed.</h1><p>This area is designed for verified student outcomes, mark improvements and genuine class experiences as Smart ICT grows.</p></div><ChartNoAxesCombined size={92} strokeWidth={1.1} /></div></section><section className="section"><div className="site-shell"><div className="results-principles"><article><ShieldCheck /><h3>Verified outcomes</h3><p>Only genuine results and approved testimonials should be published.</p></article><article><ChartNoAxesCombined /><h3>Mark journeys</h3><p>Improvements can be presented as a sequence, not only one final score.</p></article><article><MessageSquareQuote /><h3>Student voice</h3><p>Feedback can explain what changed in understanding, confidence and exam technique.</p></article></div><div className="testimonial-grid results-page-testimonials">{testimonials.map((item) => <blockquote key={item.id} className="testimonial-card"><div className="quote-mark">“</div><p>{item.quote}</p><footer><div><strong>{item.studentName}</strong><span>{item.programName}</span></div>{item.resultLabel && <em>{item.resultLabel}</em>}</footer></blockquote>)}</div><div className="center-cta"><h2>Track your own progress inside the LMS.</h2><p>Registered students can view every published online and offline result in one place.</p><Link href="/login" className="button button-primary">Student Login <ArrowRight size={17} /></Link></div></div></section></main></PublicLayout>
  );
}
