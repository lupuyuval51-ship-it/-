import { SUPPORT_EMAIL } from "@/config/legal";
import { PRIVACY_POLICY, PRIVACY_UPDATED } from "@/lib/legal/privacy-policy";

/**
 * The privacy policy, shared by the website's `/privacy` page and the Android app (Settings → Privacy policy), so the text readers see is the text
 * that is published. Presentational: no hooks. The text exists in Hebrew and English; a Spanish interface shows the English one.
 */
export function PrivacyPolicy({ locale }: { locale: string }) {
  const lang = locale === "he" ? "he" : "en";
  const doc = PRIVACY_POLICY[lang];
  return (
    <article lang={lang} dir={lang === "he" ? "rtl" : "ltr"} className="space-y-6" data-testid="privacy-policy">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">{doc.title}</h1>
        <p className="text-sm text-muted">{lang === "he" ? "עודכן לאחרונה" : "Last updated"}: <span dir="ltr" className="ltr-num">{PRIVACY_UPDATED}</span></p>
      </header>
      {doc.sections.map((s, i) => (
        <section key={s.heading} aria-labelledby={`pp-${i}`} className="space-y-2">
          <h2 id={`pp-${i}`} className="text-lg font-semibold text-neon">{s.heading}</h2>
          {s.blocks.map((b, j) => "ul" in b
            ? <ul key={j} className="list-disc space-y-1.5 ps-5 text-sm">{b.ul.map((x) => <li key={x}>{x}</li>)}</ul>
            : <p key={j} className="text-sm">{b.p}</p>)}
        </section>
      ))}
      {SUPPORT_EMAIL ? (
        <p className="text-sm">{lang === "he" ? "יצירת קשר" : "Contact"}: <a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr" className="underline underline-offset-2">{SUPPORT_EMAIL}</a></p>
      ) : null}
    </article>
  );
}
