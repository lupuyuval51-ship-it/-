"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";

/** מציג Markdown עם נוסחאות LaTeX ($...$ ו-$$...$$). קישורים נפתחים בלשונית חדשה, ללא HTML גולמי. */
export default function MarkdownImpl({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-tutor break-words", className)} dir="auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore" }]]}
        components={{
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {c}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
