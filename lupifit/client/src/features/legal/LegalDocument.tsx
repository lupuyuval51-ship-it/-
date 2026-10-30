/**
 * Layout for the public legal pages (privacy policy, terms of use, account / data deletion).
 * What they say is in ./documents.ts (per mode: hosted server or device mode) and the `legal` i18n module;
 * anything in [square brackets] is an operator placeholder and is highlighted so an unfinished draft is
 * never mistaken for final text.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Notice } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n, type TKey } from '../../i18n';
import { isDeviceMode } from '../../platform';
import { LEGAL_UPDATED, legalDocument, splitPlaceholders, type LegalDocName, type LegalMode, type LegalSection, type LegalText } from './documents';
import '../../styles/legal.css';

export { LEGAL_UPDATED, splitPlaceholders };
export type { LegalSection, LegalText };

/** The texts this build shows: device mode describes the app on the phone, otherwise the hosted service. */
export const LEGAL_MODE: LegalMode = isDeviceMode ? 'device' : 'server';

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

export function LegalDocument({ title, intro, sections, toc = false, updated = LEGAL_UPDATED[LEGAL_MODE] }: { title: TKey; intro: TKey; sections: LegalSection[]; toc?: boolean; updated?: string }) {
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
        <p className="legal-updated">{t('legal.updated', { date: formatDate(updated, { year: 'numeric', month: 'long', day: 'numeric' }) })}</p>
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

/** One legal page in this build's mode, with the UI labels it quotes in the current language. */
export function LegalPage({ name }: { name: LegalDocName }) {
  const { t } = useI18n();
  const doc = legalDocument(name, LEGAL_MODE, (key) => t(key));
  return <LegalDocument {...doc} />;
}
