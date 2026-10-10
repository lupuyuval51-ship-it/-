"use client";

/** Last-resort boundary for errors in the root layout itself (no providers are available here). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ background: "#060914", color: "#e8ecff", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1>משהו השתבש · Something went wrong</h1>
          <button onClick={reset} style={{ padding: "12px 20px", borderRadius: 12, border: 0, background: "#22e6ff", color: "#060914", fontWeight: 600, cursor: "pointer" }}>
            נסו שוב · Try again
          </button>
        </div>
      </body>
    </html>
  );
}
