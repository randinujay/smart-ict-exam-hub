import type { ResultRecord } from "@/lib/types";

interface LineChartProps {
  results: ResultRecord[];
  emptyLabel?: string;
}

export function LineChart({ results, emptyLabel = "No results have been added yet." }: LineChartProps) {
  const ordered = [...results].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  if (!ordered.length) return <div className="chart-empty">{emptyLabel}</div>;

  const width = 640;
  const height = 230;
  const left = 42;
  const right = 18;
  const top = 18;
  const bottom = 45;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const points = ordered.map((result, index) => {
    const x = left + (ordered.length === 1 ? plotWidth / 2 : (index / (ordered.length - 1)) * plotWidth);
    const y = top + ((100 - result.percentage) / 100) * plotHeight;
    return { x, y, result };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const areaPath = `${path} L${points.at(-1)?.x},${top + plotHeight} L${points[0].x},${top + plotHeight} Z`;

  return (
    <div className="line-chart-wrap">
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Marks progression chart">
        <defs>
          <linearGradient id={`chart-fill-${ordered[0].source}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((value) => {
          const y = top + ((100 - value) / 100) * plotHeight;
          return (
            <g key={value}>
              <line x1={left} x2={width - right} y1={y} y2={y} className="chart-gridline" />
              <text x={left - 10} y={y + 4} textAnchor="end" className="chart-axis-label">{value}</text>
            </g>
          );
        })}
        <path d={areaPath} className="chart-area" fill={`url(#chart-fill-${ordered[0].source})`} />
        <path d={path} className="chart-line" />
        {points.map(({ x, y, result }, index) => (
          <g key={result.id}>
            <circle cx={x} cy={y} r="5" className="chart-point" />
            <text x={x} y={height - 18} textAnchor="middle" className="chart-x-label">
              {ordered.length > 5 ? `${index + 1}` : result.assessmentTitle.slice(0, 13)}
            </text>
          </g>
        ))}
      </svg>
      <div className="chart-mobile-list">
        {ordered.map((result) => (
          <div key={result.id}><span>{result.assessmentTitle}</span><strong>{Math.round(result.percentage)}%</strong></div>
        ))}
      </div>
    </div>
  );
}
