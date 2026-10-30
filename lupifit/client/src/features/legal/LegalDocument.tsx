/**
 * Layout for the public legal pages (privacy policy, terms of use, account deletion).
 * Text comes from the `legal` i18n module; anything in [square brackets] is an operator
 * placeholder and is highlighted so an unfinished draft is never mistaken for final text.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Notice } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n, type TKey, type TParams } from '../../i18n';
import '../../styles/legal.css';

/** Date of the current draft (shown as "Last updated"). Change it whenever the text changes. */
export const LEGAL_UPDATED = '2026-10-29';

export type LegalText = TKey | { key: TKey; params: TParams };

export interface LegalSection {
  id: string;
  title: TKey;
  body?: LegalText[];
  list?: LegalText[];
  /** Numbered steps instead of bullets. */
  ordered?: boolean;
  after?: LegalText[];
}

/** Splits `[placeholder]` parts out of a sentence so they can be marked. */
export function splitPlaceholders(text: string): { text: string; placeholder: boolean }[] {
  return text
    .split(/(\[[^\]]+\])/g)
    .filter(Boolean)
    .map((part) => ({ text: part, placeholder: /^\[[^\]]+\]$/.test(part) }));
}

function Rich({ text }: { text: string }) {
  return (
    <>
      {splitPlaceholders(text).map((part, i) =>
        part.placeholder ? (
          <mark key={i} className="legal-placeholder">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

export function LegalDocument({ title, intro, sections, toc = false }: { title: TKey; intro: TKey; sections: LegalSection[]; toc?: boolean }) {
  const { t, formatDate } = useI18n();
  const { pathname, hash } = useLocation();
  const heading = t(title);
  useDocumentTitle(heading);

  // Open at the top, or at the section named in the address (e.g. /privacy#ai).
  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  const text = (item: LegalText) => (typeof item === 'string' ? t(item) : t(item.key, item.params));
  const paragraphs = (items: LegalText[] | undefined) => items?.map((item, i) => <p key={i}><Rich text={text(item)} /></p>);

  return (
    <article className="legal-page">
      <header className="legal-header">
        <h1 className="page-title">{heading}</h1>
        <p className="legal-updated">{t('legal.updated', { date: formatDate(LEGAL_UPDATED, { year: 'numeric', month: 'long', day: 'numeric' }) })}</p>
      </header>
      <Notice tone="warning" title={t('legal.draft.title')}>
        <Rich text={t('legal.draft.body')} />
      </Notice>
      <p className="legal-intro">
        <Rich text={t(intro)} />
      </p>
      {toc && (
        <nav className="legal-toc" aria-labelledby="legal-toc-title">
          <h2 id="legal-toc-title" className="legal-toc-title">
            {t('legal.contents')}
          </h2>
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a className="link link-block" href={`#${s.id}`}>
                  {t(s.title)}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {sections.map((s) => {
        const List = s.ordered ? 'ol' : 'ul';
        return (
          <section key={s.id} id={s.id} className="legal-section" aria-labelledby={`${s.id}-title`}>
            <h2 id={`${s.id}-title`}>{t(s.title)}</h2>
            {paragraphs(s.body)}
            {s.list && (
              <List className="legal-list">
                {s.list.map((item, i) => (
                  <li key={i}>
                    <Rich text={text(item)} />
                  </li>
                ))}
              </List>
            )}
            {paragraphs(s.after)}
          </section>
        );
      })}
    </article>
  );
}
