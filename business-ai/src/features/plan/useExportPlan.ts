import { useCallback, useState } from 'react';
import type { PlanSectionContent, PlanSectionKey } from '@domain/plan';
import { useNotice } from '@/components/ui';
import { useLocale, useT } from '@/i18n/I18nProvider';
import type { SectionMap } from './api';
import { exportPlanPdf } from './export';

export interface ExportablePlan {
  businessName: string;
  versionNumber: number;
  sections: SectionMap;
}

/** Export the given plan version as PDF, with pending state and a quiet error notice. */
export function useExportPlan() {
  const t = useT();
  const { locale } = useLocale();
  const notice = useNotice();
  const [exporting, setExporting] = useState(false);

  const run = useCallback(
    async (plan: ExportablePlan) => {
      if (exporting) return;
      setExporting(true);
      try {
        const sections: Partial<Record<PlanSectionKey, PlanSectionContent>> = {};
        for (const [key, row] of Object.entries(plan.sections) as [PlanSectionKey, SectionMap[PlanSectionKey]][]) {
          if (row) sections[key] = row.content;
        }
        await exportPlanPdf({ locale, businessName: plan.businessName, versionNumber: plan.versionNumber, sections });
      } catch {
        notice.show({ tone: 'error', message: t('plan.export.failed') });
      } finally {
        setExporting(false);
      }
    },
    [exporting, locale, notice, t],
  );

  return { exportPdf: run, exporting };
}
