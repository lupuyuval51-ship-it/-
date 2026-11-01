import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { lookup, useLang, useT } from '../../i18n/index.tsx';
import '../../styles/onboarding.css';

/** Numbered keys (s1, s2… each with h, p1…, b1…) rendered until the dictionary runs out; the copy lives in i18n/features/legal.ts. */
function collect(lang: 'he' | 'en', base: string, prefix: string): string[] {
  const out: string[] = [];
  for (let i = 1; i < 40; i += 1) { const v = lookup(lang, `${base}.${prefix}${i}`); if (v === undefined) break; out.push(v); }
  return out;
}

export function supportEmail(): string | undefined {
  const v = (import.meta.env['VITE_supportEmail'] as string | undefined)?.trim();
  return v ? v : undefined;
}

export function LegalDoc({ base, children }: { base: 'legal.privacy' | 'legal.terms'; children?: ReactNode }): ReactNode {
  const t = useT(); const { lang } = useLang();
  const sections: ReactNode[] = [];
  for (let i = 1; i < 40; i += 1) {
    const key = `${base}.s${i}`;
    const h = lookup(lang, `${key}.h`);
    if (h === undefined) break;
    const ps = collect(lang, key, 'p'); const bs = collect(lang, key, 'b');
    sections.push(
      <section key={key} className="stack-sm">
        <h2>{h}</h2>
        {ps.map((p, n) => <p key={`p${n}`}>{p}</p>)}
        {bs.length ? <ul>{bs.map((b, n) => <li key={`b${n}`}>{b}</li>)}</ul> : null}
      </section>,
    );
  }
  const email = supportEmail();
  return (
    <article className="stack-lg legal">
      <header className="stack-sm"><h1>{t(`${base}.title`)}</h1><p className="muted small">{t('legal.updated')}</p><p>{t(`${base}.intro`)}</p></header>
      {sections}
      <section className="stack-sm">
        <h2>{t('legal.contact.h')}</h2>
        {email ? <p>{t('legal.contact.withEmail')} <a href={`mailto:${email}`}>{email}</a></p> : <p>{t('legal.contact.noEmail')}</p>}
      </section>
      {children}
      <nav className="row-wrap small" aria-label={t('legal.navLabel')}>
        <Link to="/privacy">{t('legal.privacy.nav')}</Link><Link to="/terms">{t('legal.terms.nav')}</Link><Link to="/account-deletion">{t('legal.deletion.nav')}</Link>
      </nav>
    </article>
  );
}
