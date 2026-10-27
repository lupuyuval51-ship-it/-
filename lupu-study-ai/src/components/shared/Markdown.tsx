"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

/** רנדור Markdown + LaTeX נטען בעצלתיים (react-markdown ו-KaTeX כבדים), ובינתיים מוצג הטקסט הגולמי */
const Impl = dynamic(() => import("./MarkdownImpl"), {
  ssr: false,
  loading: () => <span className="opacity-60" />,
});

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn(className)}>
      <Impl>{children}</Impl>
    </div>
  );
}
