import type { ResultRecord, SmartInsight } from "@/lib/types";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildSmartInsights(results: ResultRecord[]): SmartInsight[] {
  const published = results
    .filter((result) => result.status === "published")
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  const smart = published.filter((result) => result.source === "smart_ict");
  if (!smart.length) {
    return [
      {
        title: "Your journey starts here",
        message: "Complete your first Smart ICT assessment to unlock data-based performance insights.",
        tone: "neutral",
      },
    ];
  }

  const scores = smart.map((result) => result.percentage);
  const latest = scores.at(-1) ?? 0;
  const previous = scores.at(-2);
  const best = Math.max(...scores);
  const overall = average(scores);
  const lastThree = scores.slice(-3);
  const momentum = lastThree.length > 1 ? (lastThree.at(-1) ?? 0) - lastThree[0] : 0;
  const insights: SmartInsight[] = [];

  if (previous !== undefined) {
    const change = latest - previous;
    insights.push({
      title: change >= 0 ? "Positive momentum" : "A small reset point",
      message:
        change >= 0
          ? `Your latest score is ${Math.round(change)} marks higher than the previous assessment.`
          : `Your latest score is ${Math.abs(Math.round(change))} marks below the previous one. One result is a signal, not a verdict.`,
      tone: change >= 0 ? "positive" : "attention",
    });
  }

  if (latest === best) {
    insights.push({
      title: "New personal best",
      message: `Your latest ${Math.round(latest)}% is your highest recorded Smart ICT score so far.`,
      tone: "positive",
    });
  } else {
    insights.push({
      title: "Best score in reach",
      message: `Your current best is ${Math.round(best)}%. You are ${Math.max(0, Math.round(best - latest))} marks away from matching it.`,
      tone: "neutral",
    });
  }

  if (lastThree.length >= 3) {
    insights.push({
      title: momentum > 0 ? "Three-paper trend is rising" : "Three-paper trend needs attention",
      message:
        momentum > 0
          ? `Across your last three assessments, your score has moved up by ${Math.round(momentum)} marks.`
          : `Across your last three assessments, your score changed by ${Math.round(momentum)} marks. Keep the next paper focused and measured.`,
      tone: momentum > 0 ? "positive" : "attention",
    });
  }

  insights.push({
    title: "Current Smart ICT average",
    message: `Your recorded average is ${Math.round(overall)}% across ${smart.length} completed assessment${smart.length === 1 ? "" : "s"}.`,
    tone: "neutral",
  });

  return insights.slice(0, 4);
}
