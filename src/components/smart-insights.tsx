import { ArrowUpRight, BrainCircuit, CircleAlert, Sparkles } from "lucide-react";
import type { SmartInsight } from "@/lib/types";

export function SmartInsights({ insights }: { insights: SmartInsight[] }) {
  return (
    <section className="smart-insights-card">
      <div className="card-heading-row">
        <div><span className="section-kicker light">SMART INSIGHTS</span><h2>Your data, translated clearly.</h2></div>
        <BrainCircuit size={30} />
      </div>
      <div className="insight-list">
        {insights.map((insight, index) => (
          <article key={`${insight.title}-${index}`} className={`insight-item insight-${insight.tone}`}>
            <span className="insight-icon">{insight.tone === "attention" ? <CircleAlert size={17} /> : <Sparkles size={17} />}</span>
            <div><strong>{insight.title}</strong><p>{insight.message}</p></div>
            <ArrowUpRight size={16} />
          </article>
        ))}
      </div>
    </section>
  );
}
