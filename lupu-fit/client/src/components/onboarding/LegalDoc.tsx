import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { AI_AVAILABLE } from '../../env.ts';
import { lookup, useLang, useT } from '../../i18n/index.tsx';
import '../../styles/onboarding.css';

/** Numbered keys (s1, s2… each with h, p1…, a1…, b1…) rendered until the dictionary runs out; the copy lives in i18n/features/legal.ts. */
function collect(lang: 'he' | 'en', base: string, prefix: string): string[] {
  const out: string[] = [];
  for (let i = 1; i < 40; i += 1) { const v = lookup(lang, `${base}.${prefix}${i}`); if (v === undefined) break; out.push(v); }
  return out;
}

export function supportEmail(): string | undefined {
  const v = (import.meta.env as Record<string, string | undefined>).VITE_SUPPORT_EMAIL?.trim();
  return v ? v : undefined;
}

/** Privacy / Terms / Account deletion switcher; the current page is marked with aria-current. */
export function LegalTabs(): ReactNode {
  const t = useT();
  return (
    <nav className="legal-tabs" aria-label={t('legal.navLabel')}>
      <NavLink to="/privacy">{t('legal.privacy.nav')}</NavLink><NavLink to="/terms">{t('legal.terms.nav')}</NavLink><NavLink to="/account-deletion">{t('legal.deletion.nav')}</NavLink>
    </nav>
  );
}

export function LegalDoc({ base, children }: { base: 'legal.privacy' | 'legal.terms' | 'legalDev.privacy' | 'legalDev.terms'; children?: ReactNode }): ReactNode {
  const t = useT(); const { lang } = useLang();
  const sections: ReactNode[] = [];
  for (let i = 1; i < 40; i += 1) {
    const key = `${base}.s${i}`;
    const h = lookup(lang, `${key}.h`);
    if (h === undefined) break;
    // `a1…` paragraphs describe the optional AI service and are shown only in a build that has one.
    const ps = [...collect(lang, key, 'p'), ...(AI_AVAILABLE ? collect(lang, key, 'a') : [])]; const bs = collect(lang, key, 'b');
    sections.push(
      <section key={key} className="stack-sm legal-section">
        <h2>{h}</h2>
        {ps.map((p, n) => <p key={`p${n}`}>{p}</p>)}
        {bs.length ? <ul>{bs.map((b, n) => <li key={`b${n}`}>{b}</li>)}</ul> : null}
      </section>,
    );
  }
  const email = supportEmail();
  return (
    <article className="stack-lg legal">
      <LegalTabs />
      <header className="stack-sm"><h1>{t(`${base}.title`)}</h1><p className="muted small">{t('legal.updated')}</p><p>{t(`${base}.intro`)}</p></header>
      {sections}
      <section className="stack-sm legal-section">
        <h2>{t('legal.contact.h')}</h2>
        {email ? <p>{t('legal.contact.withEmail')} <a href={`mailto:${email}`}>{email}</a></p> : <p>{t('legal.contact.noEmail')}</p>}
      </section>
      {children}
    </article>
  );
}
