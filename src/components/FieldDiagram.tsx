"use client";
import { useId, useMemo, type ReactNode } from "react";
import type { DiagramItem, DiagramSpec } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";

export interface FieldDiagramProps {
  spec: DiagramSpec;
  /** Accessible description (defaults to the generic "drill diagram"). */
  title?: string;
  /** Show the symbol legend under the drawing (default true). */
  legend?: boolean;
  className?: string;
}

/* Field canvases (viewBox units). Coordinates in the spec are percentages of these areas. */
const FIELDS: Record<DiagramSpec["field"], { w: number; h: number }> = {
  lane: { w: 320, h: 160 },
  square: { w: 240, h: 240 },
  half: { w: 320, h: 220 },
  strip: { w: 320, h: 100 },
};

const C = {
  field: "var(--c-primary-soft)",
  line: "var(--c-primary)",
  surface: "var(--c-surface)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "var(--c-primary)",
  accent: "var(--c-accent)",
  danger: "var(--c-danger)",
  info: "var(--c-info)",
};

type PointItem = Extract<DiagramItem, { x: number }>;
type ArrowItem = Extract<DiagramItem, { from: [number, number] }>;
const isArrow = (i: DiagramItem): i is ArrowItem => "from" in i;

const LABEL_STYLE = { fontSize: 10, fontWeight: 600, paintOrder: "stroke" as const, stroke: C.surface, strokeWidth: 3, strokeLinejoin: "round" as const, fill: C.text };

function Cone({ x, y, size = 7 }: { x: number; y: number; size?: number }) {
  return <polygon points={`${x},${y - size} ${x - size * 0.85},${y + size * 0.7} ${x + size * 0.85},${y + size * 0.7}`} fill={C.accent} stroke={C.surface} strokeWidth={1.2} strokeLinejoin="round" />;
}

function FieldBackground({ field, w, h }: { field: DiagramSpec["field"]; w: number; h: number }) {
  const m = 3;
  const common = { x: m, y: m, width: w - 2 * m, height: h - 2 * m, rx: 6, fill: C.field, stroke: C.line, strokeOpacity: 0.55, strokeWidth: 1.5 };
  return (
    <g>
      <rect {...common} />
      {field === "lane" && (
        <>
          <line x1={w * 0.1} y1={m} x2={w * 0.1} y2={h - m} stroke={C.line} strokeOpacity={0.45} strokeWidth={1.5} />
          <line x1={w * 0.9} y1={m} x2={w * 0.9} y2={h - m} stroke={C.line} strokeOpacity={0.45} strokeWidth={1.5} />
          <line x1={w * 0.5} y1={m} x2={w * 0.5} y2={h - m} stroke={C.line} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
        </>
      )}
      {field === "square" && (
        <>
          <line x1={w * 0.5} y1={m} x2={w * 0.5} y2={h - m} stroke={C.line} strokeOpacity={0.18} strokeWidth={1} strokeDasharray="4 4" />
          <line x1={m} y1={h * 0.5} x2={w - m} y2={h * 0.5} stroke={C.line} strokeOpacity={0.18} strokeWidth={1} strokeDasharray="4 4" />
        </>
      )}
      {field === "half" && (
        <>
          <rect x={w * 0.8} y={m} width={w * 0.2 - m} height={h - 2 * m} rx={6} fill={C.line} fillOpacity={0.12} />
          <line x1={w * 0.8} y1={m} x2={w * 0.8} y2={h - m} stroke={C.line} strokeOpacity={0.6} strokeWidth={2} />
          <line x1={m} y1={h * 0.5} x2={w * 0.8} y2={h * 0.5} stroke={C.line} strokeOpacity={0.18} strokeWidth={1} strokeDasharray="4 4" />
          <circle cx={w * 0.55} cy={h * 0.5} r={2} fill={C.line} fillOpacity={0.5} />
        </>
      )}
      {field === "strip" &&
        Array.from({ length: 9 }, (_, i) => (w * (i + 1)) / 10).map((x) => (
          <line key={x} x1={x} y1={h - m - 6} x2={x} y2={h - m} stroke={C.line} strokeOpacity={0.4} strokeWidth={1} />
        ))}
    </g>
  );
}

function PointSymbol({ item, x, y }: { item: PointItem; x: number; y: number }) {
  switch (item.type) {
    case "cone":
      return <Cone x={x} y={y} />;
    case "player":
      return <circle cx={x} cy={y} r={7} fill={C.primary} stroke={C.surface} strokeWidth={2} />;
    case "partner":
      return <circle cx={x} cy={y} r={7} fill={C.surface} stroke={C.primary} strokeWidth={2.5} />;
    case "defender":
      return <circle cx={x} cy={y} r={7} fill={C.danger} stroke={C.surface} strokeWidth={2} />;
    case "target":
      return (
        <g>
          <circle cx={x} cy={y} r={10} fill={C.accent} stroke={C.surface} strokeWidth={1.5} />
          <circle cx={x} cy={y} r={6} fill={C.surface} />
          <circle cx={x} cy={y} r={2.5} fill={C.accent} />
        </g>
      );
    case "disc":
      return <ellipse cx={x} cy={y} rx={5.5} ry={3} fill="#ffffff" stroke={C.text} strokeWidth={1.2} />;
    case "gate":
      return (
        <g>
          <line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke={C.accent} strokeWidth={1.5} strokeDasharray="3 3" />
          <Cone x={x} y={y - 14} size={5.5} />
          <Cone x={x} y={y + 14} size={5.5} />
        </g>
      );
    case "marker":
      return (
        <g stroke={C.muted} strokeWidth={2.2} strokeLinecap="round">
          <line x1={x - 4.5} y1={y - 4.5} x2={x + 4.5} y2={y + 4.5} />
          <line x1={x - 4.5} y1={y + 4.5} x2={x + 4.5} y2={y - 4.5} />
        </g>
      );
  }
}

function zigzag(x1: number, y1: number, x2: number, y2: number, amp = 4, wave = 9): string {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const n = Math.max(2, Math.floor(len / wave));
  const pts: string[] = [`${x1},${y1}`];
  for (let i = 1; i < n; i++) {
    const t = (i / n) * len;
    const s = i % 2 === 0 ? 0 : i % 4 === 1 ? amp : -amp;
    pts.push(`${x1 + ux * t + px * s},${y1 + uy * t + py * s}`);
  }
  pts.push(`${x2},${y2}`);
  return pts.join(" ");
}

function Arrow({ item, w, h, markers }: { item: ArrowItem; w: number; h: number; markers: Record<ArrowItem["type"], string> }) {
  const x1 = (item.from[0] / 100) * w, y1 = (item.from[1] / 100) * h;
  const x2 = (item.to[0] / 100) * w, y2 = (item.to[1] / 100) * h;
  const colour = item.type === "run" ? C.text : item.type === "throw" ? C.accent : C.info;
  const dashed = item.type === "throw" || item.dashed;
  const common = { fill: "none", stroke: colour, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, markerEnd: `url(#${markers[item.type]})` };
  let labelX = (x1 + x2) / 2, labelY = (y1 + y2) / 2;
  let shape: ReactNode;
  if (item.type === "shuffle") {
    shape = <polyline points={zigzag(x1, y1, x2, y2)} {...common} strokeDasharray={item.dashed ? "3 3" : undefined} />;
  } else if (item.curve) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const cx = (x1 + x2) / 2 - (dy / len) * len * 0.3;
    const cy = (y1 + y2) / 2 + (dx / len) * len * 0.3;
    labelX = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
    labelY = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
    shape = <path d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`} {...common} strokeDasharray={dashed ? "6 5" : undefined} />;
  } else {
    shape = <line x1={x1} y1={y1} x2={x2} y2={y2} {...common} strokeDasharray={dashed ? "6 5" : undefined} />;
  }
  // Label sits just beside the path, on the side away from the field's centre so it does not cover the line.
  const above = labelY > h / 2 ? -7 : 11;
  return (
    <g>
      {shape}
      {item.label && (
        <text x={labelX} y={labelY + above} textAnchor="middle" style={LABEL_STYLE}>
          {item.label}
        </text>
      )}
    </g>
  );
}

/**
 * Renders a DiagramSpec as an SVG. Coordinates are spatial and are NOT mirrored in RTL
 * (the wrapper forces dir="ltr"); labels stay as authored.
 */
export function FieldDiagram({ spec, title, legend = true, className }: FieldDiagramProps) {
  const { t } = useT();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { w, h } = FIELDS[spec.field] ?? FIELDS.lane;
  const markers = { run: `${uid}-run`, throw: `${uid}-throw`, shuffle: `${uid}-shuffle` } as const;
  const points = spec.items.filter((i): i is PointItem => !isArrow(i));
  const arrows = spec.items.filter(isArrow);
  const legendTypes = useMemo(() => Array.from(new Set(spec.items.map((i) => i.type))), [spec.items]);
  const label = title ?? t("ui.field.diagram");

  return (
    <figure dir="ltr" className={cn("m-0 flex w-full flex-col gap-2", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="block h-auto w-full select-none font-sans" style={{ direction: "ltr" }}>
        <title>{label}</title>
        <defs>
          {(Object.keys(markers) as ArrowItem["type"][]).map((type) => (
            <marker key={type} id={markers[type]} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M0 0.5 L10 5 L0 9.5 z" fill={type === "run" ? C.text : type === "throw" ? C.accent : C.info} />
            </marker>
          ))}
        </defs>
        <FieldBackground field={spec.field} w={w} h={h} />
        {arrows.map((item, i) => (
          <Arrow key={`a${i}`} item={item} w={w} h={h} markers={markers} />
        ))}
        {points.map((item, i) => {
          const x = (item.x / 100) * w, y = (item.y / 100) * h;
          return (
            <g key={`p${i}`}>
              <PointSymbol item={item} x={x} y={y} />
              {item.label && (
                <text x={x} y={y + (item.type === "gate" ? 30 : 19)} textAnchor="middle" style={LABEL_STYLE}>
                  {item.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {legend && legendTypes.length > 0 && (
        <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" dir="auto">
          {legendTypes.map((type) => (
            <span key={type} className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden>
                <LegendSymbol type={type} />
              </svg>
              {t(`ui.field.${type}`)}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}

function LegendSymbol({ type }: { type: DiagramItem["type"] }) {
  switch (type) {
    case "cone":
      return <Cone x={12} y={13} size={8} />;
    case "player":
      return <circle cx={12} cy={12} r={8} fill={C.primary} />;
    case "partner":
      return <circle cx={12} cy={12} r={7} fill={C.surface} stroke={C.primary} strokeWidth={3} />;
    case "defender":
      return <circle cx={12} cy={12} r={8} fill={C.danger} />;
    case "target":
      return (
        <g>
          <circle cx={12} cy={12} r={9} fill={C.accent} />
          <circle cx={12} cy={12} r={5.5} fill={C.surface} />
          <circle cx={12} cy={12} r={2.2} fill={C.accent} />
        </g>
      );
    case "disc":
      return <ellipse cx={12} cy={12} rx={9} ry={5} fill="#ffffff" stroke={C.text} strokeWidth={1.5} />;
    case "gate":
      return (
        <g>
          <Cone x={12} y={5} size={4.5} />
          <Cone x={12} y={19} size={4.5} />
        </g>
      );
    case "marker":
      return (
        <g stroke={C.muted} strokeWidth={3} strokeLinecap="round">
          <line x1={6} y1={6} x2={18} y2={18} />
          <line x1={6} y1={18} x2={18} y2={6} />
        </g>
      );
    case "run":
      return <path d="M3 12 H17 M13 7 L19 12 L13 17" fill="none" stroke={C.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />;
    case "throw":
      return <path d="M3 12 H17 M13 7 L19 12 L13 17" fill="none" stroke={C.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />;
    case "shuffle":
      return <polyline points="3,12 7,8 11,16 15,8 19,16 21,12" fill="none" stroke={C.info} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />;
  }
}
