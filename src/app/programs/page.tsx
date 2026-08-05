import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { getPublicPrograms } from "@/lib/data";

export const metadata: Metadata = { title: "Programs", description: "Explore current Smart ICT programs." };

export default async function ProgramsPage() {
  const programs = await getPublicPrograms();
  return (
    <PublicLayout>
      <main className="public-page inner-public-page">
        <section className="inner-hero">
          <div className="site-shell inner-hero-grid">
            <div><span className="section-kicker">SMART ICT PROGRAMS</span><h1>Choose your ICT learning journey.</h1><p>Smart ICT programs are organised by exam year and can expand dynamically as new O/L and A/L classes are introduced.</p></div>
            <div className="inner-hero-stat"><strong>{programs.length}</strong><span>currently available programs</span></div>
          </div>
        </section>
        <section className="section">
          <div className="site-shell program-list-grid">
            {programs.map((program) => (
              <article key={program.id} className="program-list-card">
                <div className="program-list-image"><Image src={program.image} alt={program.name} width={760} height={760} /></div>
                <div className="program-list-body">
                  <div className="program-tags"><span>{program.academicLevel}</span>{program.examYear && <span>Exam {program.examYear}</span>}</div>
                  <h2>{program.name}</h2><p>{program.description}</p>
                  <div className="program-checks"><span><CheckCircle2 size={17} /> Sinhala & English Medium</span><span><CheckCircle2 size={17} /> Smart ICT LMS access</span><span><CheckCircle2 size={17} /> Quizzes, papers and progress tracking</span></div>
                  <Link href={`/programs/${program.slug}`} className="button button-primary">View details <ArrowRight size={17} /></Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
