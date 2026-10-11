"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Flag } from "lucide-react";
import { useT } from "@/components/I18nProvider";
import { Button, cx } from "@/components/ui";
import type { PublicChallenge } from "@/lib/game/challenges/grade";
import { describeGrid } from "@/lib/game/a11y/scene";
import type { Block } from "@/lib/game/spec/schema";

type ProgramChallenge = Extract<PublicChallenge, { type: "program" }>;
type Path = (number | "body" | "else")[]; // indices into nested containers

function containerAt(program: Block[], path: Path): Block[] {
  let cur: Block[] = program;
  for (let i = 0; i < path.length; i += 2) {
    const idx = path[i] as number;
    const which = path[i + 1] as "body" | "else";
    const b = cur[idx];
    if (!b || (b.t !== "repeat" && b.t !== "if")) return cur;
    cur = which === "else" && b.t === "if" ? b.else : b.body;
  }
  return cur;
}

const countBlocks = (p: Block[]): number => p.reduce((n, b) => n + 1 + (b.t === "repeat" ? countBlocks(b.body) : b.t === "if" ? countBlocks(b.body) + countBlocks(b.else) : 0), 0);

function mutate(program: Block[], fn: (root: Block[]) => void): Block[] {
  const copy = structuredClone(program);
  fn(copy);
  return copy;
}

const DIR_ARROW = { N: "▲", E: "▶", S: "▼", W: "◀" } as const;

function Grid({ ch, trail, step }: { ch: ProgramChallenge; trail: { x: number; y: number }[] | null; step: number }) {
  const { width, height, start, goal, walls } = ch.grid;
  const wallSet = new Set(walls.map((w) => `${w.x},${w.y}`));
  const at = trail ? Math.min(step, trail.length - 1) : 0;
  const pos = trail ? trail[at]! : start;
  const visited = new Set((trail ?? []).slice(0, at + 1).map((c) => `${c.x},${c.y}`));
  // facing: the last real move along the trail (or the start direction until the robot has moved)
  let dir: keyof typeof DIR_ARROW = start.dir;
  if (trail) {
    for (let i = at; i > 0; i--) {
      const dx = trail[i]!.x - trail[i - 1]!.x, dy = trail[i]!.y - trail[i - 1]!.y;
      if (dx || dy) { dir = dx > 0 ? "E" : dx < 0 ? "W" : dy > 0 ? "S" : "N"; break; }
    }
  }
  const t = useT();
  return (
    <div className="grid gap-1 rounded-xl border border-line bg-ink-900 p-2" style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 2.2rem))`, direction: "ltr" }} role="img" aria-label={describeGrid(ch.grid, pos, dir, t)}>
      {Array.from({ length: width * height }, (_, i) => {
        const x = i % width, y = Math.floor(i / width);
        const isWall = wallSet.has(`${x},${y}`);
        const isGoal = goal.x === x && goal.y === y;
        const isBot = pos.x === x && pos.y === y;
        const seen = visited.has(`${x},${y}`);
        return (
          <div key={i} className={cx("relative flex aspect-square items-center justify-center rounded-md text-lg transition-colors duration-200",
            isWall ? "bg-gradient-to-br from-ink-600 to-ink-700 shadow-inner" : seen ? "bg-neon/25" : "bg-ink-800",
            isGoal && "ring-2 ring-lime/70 animate-pulse")}>
            {isBot ? (
              <span key={`${at}-${x}-${y}`} className="lu-pop relative text-neon">
                {trail ? <Bot aria-hidden className="size-4" /> : DIR_ARROW[start.dir]}
                {trail && <span aria-hidden className="absolute -end-2 -top-2 text-[10px] leading-none text-neon">{DIR_ARROW[dir]}</span>}
              </span>
            ) : isGoal ? <Flag aria-hidden className="size-4 text-lime" /> : isWall ? <span aria-hidden className="text-ink-500">▓</span> : seen ? <span aria-hidden className="text-[10px] text-neon/60">●</span> : ""}
          </div>
        );
      })}
    </div>
  );
}

export function ProgramBuilder({ challenge, trail, disabled, onChange }: { challenge: ProgramChallenge; trail: { x: number; y: number }[] | null; disabled: boolean; onChange: (program: Block[]) => void }) {
  const t = useT();
  const [program, setProgram] = useState<Block[]>([]);
  const [path, setPath] = useState<Path>([]);
  const [anim, setAnim] = useState<{ trail: typeof trail; step: number }>({ trail, step: 0 });
  if (anim.trail !== trail) setAnim({ trail, step: 0 }); // restart the run animation when a new result arrives
  const step = anim.trail === trail ? anim.step : 0;
  const [note, setNote] = useState("");
  const used = countBlocks(program);
  const full = used >= challenge.maxBlocks;

  useEffect(() => onChange(program), [program, onChange]);
  useEffect(() => {
    if (!trail) return;
    const id = setInterval(() => setAnim((a) => (a.trail === trail && a.step + 1 < trail.length ? { ...a, step: a.step + 1 } : a)), 170);
    return () => clearInterval(id);
  }, [trail]);

  const add = (block: Block) => {
    if (full || disabled) return;
    setProgram((p) => mutate(p, (root) => containerAt(root, path).push(block)));
    setNote(t("a11y.program.added", { label: labelOf(block), used: used + 1, max: challenge.maxBlocks }));
    if (block.t === "repeat") setPath((pp) => [...pp, containerAt(program, pp).length, "body"]);
    if (block.t === "if") setPath((pp) => [...pp, containerAt(program, pp).length, "body"]);
  };
  const palette = useMemo(() => {
    const items: { kind: string; label: string; make: () => Block }[] = [];
    if (challenge.allowed.includes("move")) items.push({ kind: "move", label: t("block.move"), make: () => ({ t: "move" }) });
    if (challenge.allowed.includes("turnLeft")) items.push({ kind: "left", label: t("block.left"), make: () => ({ t: "left" }) });
    if (challenge.allowed.includes("turnRight")) items.push({ kind: "right", label: t("block.right"), make: () => ({ t: "right" }) });
    if (challenge.allowed.includes("repeat")) items.push({ kind: "repeat", label: t("block.repeat", { n: "N" }), make: () => ({ t: "repeat", n: 2, body: [] as unknown as Block[] }) as Block });
    if (challenge.allowed.includes("ifPathClear")) items.push({ kind: "if", label: t("block.if"), make: () => ({ t: "if", body: [], else: [] }) });
    return items;
  }, [challenge.allowed, t]);

  const labelOf = (b: Block) => (b.t === "move" ? t("block.move") : b.t === "left" ? t("block.left") : b.t === "right" ? t("block.right") : b.t === "repeat" ? t("block.repeat", { n: b.n }) : t("block.if"));
  const removeAt = (p: Path, idx: number) => {
    const gone = containerAt(program, p)[idx];
    setProgram((prog) => mutate(prog, (root) => void containerAt(root, p).splice(idx, 1)));
    if (gone) setNote(t("a11y.program.removed", { label: labelOf(gone) }));
    // the delete button disappears with its row: keep keyboard / TalkBack focus inside the program
    setTimeout(() => (listRef.current?.querySelector<HTMLElement>("[data-block-delete]") ?? listRef.current?.querySelector<HTMLElement>("button"))?.focus(), 0);
  };
  const setCount = (p: Path, idx: number, delta: number) =>
    setProgram((prog) => mutate(prog, (root) => {
      const b = containerAt(root, p)[idx];
      if (b?.t === "repeat") {
        b.n = Math.max(2, Math.min(9, b.n + delta));
        setNote(t("a11y.program.repeatCount", { n: b.n }));
      }
    }));
  const listRef = useRef<HTMLDivElement>(null);
  const samePath = (a: Path, b: Path) => a.length === b.length && a.every((v, i) => v === b[i]);

  const renderList = (blocks: Block[], at: Path): React.ReactNode =>
    blocks.map((b, i) => {
      const label = labelOf(b);
      const container = b.t === "repeat" || b.t === "if";
      const bodyPath: Path = [...at, i, "body"];
      const elsePath: Path = [...at, i, "else"];
      return (
        <li key={i} className="space-y-1">
          <div className={cx("flex flex-wrap items-center gap-2 rounded-lg border px-2 py-1.5 text-sm", container ? "border-violet/50 bg-violet/10" : "border-line bg-ink-700")}>
            <span className="min-w-0 flex-1 break-words">{label}</span>
            {b.t === "repeat" && !disabled && (
              <span className="flex items-center gap-1">
                <button type="button" aria-label={`${t("a11y.program.fewer")}: ${label}`} className="grid min-h-11 min-w-11 place-items-center rounded bg-ink-600" onClick={() => setCount(at, i, -1)}><span aria-hidden>−</span></button>
                <button type="button" aria-label={`${t("a11y.program.more")}: ${label}`} className="grid min-h-11 min-w-11 place-items-center rounded bg-ink-600" onClick={() => setCount(at, i, 1)}><span aria-hidden>+</span></button>
              </span>
            )}
            {!disabled && <button type="button" data-block-delete aria-label={t("a11y.program.delete", { delete: t("common.delete"), label })} className="grid min-h-11 min-w-11 place-items-center rounded text-rose hover:bg-rose/20" onClick={() => removeAt(at, i)}><span aria-hidden>×</span></button>}
          </div>
          {container && (
            <div className="ms-4 space-y-1">
              <button type="button" aria-pressed={samePath(path, bodyPath)} onClick={() => setPath(bodyPath)} className={cx("min-h-11 w-full rounded-md border border-dashed px-2 py-1 text-start text-[0.8125rem]", samePath(path, bodyPath) ? "border-neon text-neon" : "border-line text-muted")}>
                {samePath(path, bodyPath) ? t("challenge.program.insideLoop") : t("block.nested")}
              </button>
              <ul className="space-y-1">{renderList(b.body, bodyPath)}</ul>
              {b.t === "if" && (
                <>
                  <button type="button" aria-pressed={samePath(path, elsePath)} onClick={() => setPath(elsePath)} className={cx("min-h-11 w-full rounded-md border border-dashed px-2 py-1 text-start text-[0.8125rem]", samePath(path, elsePath) ? "border-neon text-neon" : "border-line text-muted")}>
                    {t("block.else")}
                  </button>
                  <ul className="space-y-1">{renderList(b.else, elsePath)}</ul>
                </>
              )}
            </div>
          )}
        </li>
      );
    });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("challenge.program.help", { used, max: challenge.maxBlocks })}</p>
      <p role="status" aria-live="polite" className="sr-only">{note}</p>
      <div className="flex flex-wrap items-start gap-4">
        <Grid ch={challenge} trail={trail} step={step} />
        <div className="min-w-56 flex-1 space-y-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t("challenge.program.palette")}</p>
            <div className="flex flex-wrap gap-2">
              {palette.map((p) => (
                <Button key={p.kind} type="button" size="sm" variant="secondary" disabled={full || disabled} onClick={() => add(p.make())} data-block={p.kind}>
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-ink-900 p-2" ref={listRef}>
            <button type="button" aria-pressed={path.length === 0} onClick={() => setPath([])} className={cx("mb-2 min-h-11 w-full rounded-md border border-dashed px-2 py-1 text-start text-[0.8125rem]", path.length === 0 ? "border-neon text-neon" : "border-line text-muted")}>
              {t("challenge.program.addTo", { where: path.length === 0 ? t("challenge.program.top") : t("block.nested") })}
            </button>
            {program.length === 0 ? <p className="p-2 text-sm text-muted">{t("challenge.program.empty")}</p> : <ul className="space-y-1" data-testid="program" aria-label={t("a11y.program.list")}>{renderList(program, [])}</ul>}
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="ghost" disabled={disabled || program.length === 0} onClick={() => { setProgram([]); setPath([]); setNote(t("a11y.program.cleared")); }}>{t("challenge.program.clear")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
