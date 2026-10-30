/**
 * Safe "Markdown-lite" for coach replies: paragraphs, line breaks, "-"/"*" and "1."
 * lists, **bold**, *italic* and `inline code`. It builds React elements from a small
 * parsed tree — never HTML strings — so any markup or script in model output is shown
 * as inert text. Links are not supported: URLs stay plain text.
 */
import { Fragment, type ReactNode } from 'react';

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'code'; text: string };

/** A line of inline content; list items and paragraphs may span several lines. */
export type Line = Inline[];

export type Block =
  | { type: 'paragraph'; lines: Line[] }
  | { type: 'ul'; items: Line[][] }
  | { type: 'ol'; start: number; items: Line[][] };

const BULLET = /^\s{0,3}[-*•]\s+(.*)$/;
const ORDERED = /^\s{0,3}(\d{1,3})[.)]\s+(.*)$/;
const HEADING = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/;
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const CONTINUATION = /^\s{2,}\S/;

/** Inline tokens: `code`, **bold**, *italic* (the asterisks must hug the text). */
const INLINE = /`([^`\n]+)`|\*\*(?=\S)([^\n]+?)(?<=\S)\*\*|\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  const push = (t: string) => {
    if (!t) return;
    const prev = out[out.length - 1];
    if (prev?.type === 'text') prev.text += t;
    else out.push({ type: 'text', text: t });
  };
  for (const m of text.matchAll(INLINE)) {
    push(text.slice(last, m.index));
    if (m[1] != null) out.push({ type: 'code', text: m[1] });
    else if (m[2] != null) out.push({ type: 'strong', children: parseInline(m[2]) });
    else if (m[3] != null) out.push({ type: 'em', children: parseInline(m[3]) });
    last = (m.index ?? 0) + m[0].length;
  }
  push(text.slice(last));
  return out;
}

export function parseMarkdownLite(source: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  const close = () => {
    if (current) blocks.push(current);
    current = null;
  };
  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    if (!raw.trim()) {
      close();
      continue;
    }
    if (RULE.test(raw)) {
      close();
      continue;
    }
    const heading = HEADING.exec(raw);
    if (heading) {
      close();
      blocks.push({ type: 'paragraph', lines: [[{ type: 'strong', children: parseInline(heading[1] ?? '') }]] });
      continue;
    }
    const bullet = BULLET.exec(raw);
    const ordered = bullet ? null : ORDERED.exec(raw);
    const block = current as Block | null;
    if (bullet) {
      if (block?.type !== 'ul') {
        close();
        current = { type: 'ul', items: [] };
      }
      (current as Extract<Block, { type: 'ul' }>).items.push([parseInline(bullet[1] ?? '')]);
      continue;
    }
    if (ordered) {
      if (block?.type !== 'ol') {
        close();
        current = { type: 'ol', start: Number(ordered[1]) || 1, items: [] };
      }
      (current as Extract<Block, { type: 'ol' }>).items.push([parseInline(ordered[2] ?? '')]);
      continue;
    }
    if (block && block.type !== 'paragraph' && CONTINUATION.test(raw)) {
      // An indented line continues the last list item.
      block.items[block.items.length - 1]!.push(parseInline(raw.trim()));
      continue;
    }
    if (block?.type === 'paragraph') {
      block.lines.push(parseInline(raw.trim()));
    } else {
      close();
      current = { type: 'paragraph', lines: [parseInline(raw.trim())] };
    }
  }
  close();
  return blocks;
}

function renderInline(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.type) {
      case 'text':
        return <Fragment key={i}>{n.text}</Fragment>;
      case 'strong':
        return <strong key={i}>{renderInline(n.children)}</strong>;
      case 'em':
        return <em key={i}>{renderInline(n.children)}</em>;
      case 'code':
        return <code key={i}>{n.text}</code>;
    }
  });
}

function renderLines(lines: Line[]): ReactNode {
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {renderInline(line)}
    </Fragment>
  ));
}

export function MarkdownLite({ text, className }: { text: string; className?: string }) {
  const blocks = parseMarkdownLite(text);
  return (
    <div className={`md-lite${className ? ` ${className}` : ''}`}>
      {blocks.map((b, i) => {
        if (b.type === 'paragraph') return <p key={i}>{renderLines(b.lines)}</p>;
        const items = b.items.map((item, j) => <li key={j}>{renderLines(item)}</li>);
        return b.type === 'ul' ? (
          <ul key={i}>{items}</ul>
        ) : (
          <ol key={i} start={b.start}>
            {items}
          </ol>
        );
      })}
    </div>
  );
}
