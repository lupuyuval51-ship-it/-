import { LegalDocument, type LegalSection } from '../../features/legal/LegalDocument';

/** Public terms of use (/terms). */
export default function TermsPage() {
  const sections: LegalSection[] = [
    {
      id: 'medical',
      title: 'legal.terms.medical.title',
      body: ['legal.terms.medical.general'],
      list: ['legal.terms.medical.doctor', 'legal.terms.medical.stop', 'legal.terms.medical.estimates', 'legal.terms.medical.ai'],
    },
    { id: 'eligibility', title: 'legal.terms.eligibility.title', body: ['legal.terms.eligibility.age', 'legal.terms.eligibility.minors'] },
    { id: 'account', title: 'legal.terms.account.title', body: ['legal.terms.account.accurate', 'legal.terms.account.password'] },
    { id: 'use', title: 'legal.terms.use.title', body: ['legal.terms.use.body'] },
    { id: 'content', title: 'legal.terms.content.title', body: ['legal.terms.content.yours', 'legal.terms.content.ours'] },
    { id: 'service', title: 'legal.terms.service.title', body: ['legal.terms.service.body'] },
    { id: 'liability', title: 'legal.terms.liability.title', body: ['legal.terms.liability.body'] },
    { id: 'ending', title: 'legal.terms.ending.title', body: ['legal.terms.ending.body'] },
    { id: 'law', title: 'legal.terms.law.title', body: ['legal.terms.law.body'] },
    { id: 'changes', title: 'legal.terms.changes.title', body: ['legal.terms.changes.body'] },
    { id: 'contact', title: 'legal.terms.contact.title', body: ['legal.terms.contact.body'] },
  ];
  return <LegalDocument title="legal.terms.title" intro="legal.terms.intro" sections={sections} toc />;
}
