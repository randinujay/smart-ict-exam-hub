import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BrainCircuit, Landmark, MessageSquareText, MonitorCog, UsersRound } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";

export const metadata: Metadata = { title: "About Randinu", description: "Learn more about Randinu Jayaratne and the Smart ICT teaching approach." };

export default function AboutPage() {
  return (
    <PublicLayout>
      <main className="public-page inner-public-page">
        <section className="about-hero">
          <div className="site-shell about-hero-grid"><div className="about-portrait"><Image src="/randinu-portrait.jpg" alt="Randinu Jayaratne" width={680} height={740} priority /></div><div><span className="section-kicker">RANDINU JAYARATNE</span><h1>Teaching ICT with clarity, curiosity and a smarter system.</h1><p>Smart ICT brings together a strong interest in technology, communication, education and student development. The aim is not only to cover content, but to make students understand it, retain it and use it confidently in examinations and beyond.</p><div className="teacher-qualification-row"><span>Dip. in Law (Reading)</span><span>Expecting University Entrance</span></div><Link href="/programs" className="button button-primary">Explore programs <ArrowRight size={17} /></Link></div></div>
        </section>
        <section className="section"><div className="site-shell about-story-grid"><div><span className="section-kicker">BACKGROUND</span><h2>Leadership, communication and ICT experience</h2><p>Randinu served as ICT Society Chairman for 2024/25 and Deputy Head Prefect, while actively participating in debating, public speaking, announcing, ICT quizzes, graphic design and school technology initiatives.</p><p>That combination shapes the Smart ICT approach: technical content is explained through strong communication, and the class is organised with the mindset of a modern digital learning product rather than a disconnected set of tuition sessions.</p></div><div className="about-capability-grid"><article><MonitorCog /><strong>ICT Leadership</strong><span>ICT Society leadership and technology-focused school projects.</span></article><article><MessageSquareText /><strong>Communication</strong><span>Debating, public speaking, announcing and student-facing communication.</span></article><article><UsersRound /><strong>Student Leadership</strong><span>Experience as Deputy Head Prefect and organising student initiatives.</span></article><article><BrainCircuit /><strong>Future-Focused</strong><span>Interests spanning digital transformation, management, law and policy.</span></article></div></div></section>
        <section className="section dark-section"><div className="site-shell teaching-philosophy"><div><span className="section-kicker light">TEACHING PHILOSOPHY</span><h2>Understand first. Practise intelligently. Measure the progress.</h2></div><div className="philosophy-list"><span><Award /><div><strong>Student-oriented teaching</strong><p>Learning should meet the student at their actual level—not an imaginary average.</p></div></span><span><Landmark /><div><strong>Exam awareness</strong><p>Content, memory and answering technique should all lead toward confident performance.</p></div></span><span><BrainCircuit /><div><strong>Smart retention</strong><p>Recall, repetition and simplified structures make knowledge easier to keep and retrieve.</p></div></span></div></div></section>
      </main>
    </PublicLayout>
  );
}
