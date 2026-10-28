import { useState } from 'react';
import type { DayNutritionDTO, NutritionTargetsDTO, ProfileDTO } from '@shared/types';
import { Button, Card, LinkButton, Modal, Notice, ProgressRing } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useMacroFormat } from './Macros';

type MacroKey = 'proteinG' | 'carbsG' | 'fatG' | 'fiberG';
const MACROS: { key: MacroKey; label: 'common.macros.protein' | 'common.macros.carbs' | 'common.macros.fat' | 'common.macros.fiber'; tone: 'primary' | 'info' | 'warning' | 'success' }[] = [
  { key: 'proteinG', label: 'common.macros.protein', tone: 'primary' },
  { key: 'carbsG', label: 'common.macros.carbs', tone: 'info' },
  { key: 'fatG', label: 'common.macros.fat', tone: 'warning' },
  { key: 'fiberG', label: 'common.macros.fiber', tone: 'success' },
];

/** Calorie ring + macro progress bars for one day, with an explanation of how targets are computed. */
export function DayOverview({ day, profile, isToday }: { day: DayNutritionDTO; profile: ProfileDTO | undefined; isToday: boolean }) {
  const { t } = useI18n();
  const f = useMacroFormat();
  const [infoOpen, setInfoOpen] = useState(false);
  const targets = day.targets;
  const minor = profile?.isMinor ?? false;
  const consumed = day.totals.kcal;
  const remainingKcal = targets ? targets.calories - consumed : null;

  return (
    <Card
      title={isToday ? t('nutrition.overview.title') : t('nutrition.overview.titleOther')}
      actions={
        targets ? (
          <Button variant="ghost" size="sm" icon="info" onClick={() => setInfoOpen(true)}>
            {t('nutrition.overview.howCalculated')}
          </Button>
        ) : null
      }
      className="nutri-overview-card"
    >
      <div className="nutri-overview">
        <div className="nutri-ring">
          <ProgressRing
            value={consumed}
            max={targets?.calories ?? 0}
            size={168}
            stroke={12}
            tone={remainingKcal != null && remainingKcal < 0 && !minor ? 'warning' : 'primary'}
            label={
              targets
                ? t('nutrition.overview.ringLabel', { consumed: f.kcal(consumed), target: f.kcal(targets.calories) })
                : t('nutrition.overview.ringLabelNoTarget', { consumed: f.kcal(consumed) })
            }
          >
            <span className="nutri-ring-value num" data-testid="kcal-consumed">
              {f.kcal(consumed)}
            </span>
            <span className="nutri-ring-sub">{targets ? t('nutrition.overview.ofTarget', { target: f.kcal(targets.calories) }) : t('nutrition.overview.eaten')}</span>
          </ProgressRing>
          {remainingKcal != null && (
            <p className="nutri-remaining" aria-live="polite">
              {remainingKcal >= 0
                ? t(minor ? 'nutrition.overview.leftMinor' : 'nutrition.overview.left', { value: f.kcal(remainingKcal) })
                : t(minor ? 'nutrition.overview.overMinor' : 'nutrition.overview.over', { value: f.kcal(-remainingKcal) })}
            </p>
          )}
        </div>
        <div className="nutri-macros">
          {MACROS.map(({ key, label, tone }) => {
            const value = day.totals[key];
            const target = targets ? targetFor(targets, key) : null;
            const left = target != null ? target - value : null;
            return (
              <div key={key} className={`nutri-macro nutri-macro-${tone}`}>
                {target != null ? (
                  <ProgressRing
                    value={value}
                    max={target}
                    size={60}
                    stroke={7}
                    tone={!minor && key !== 'proteinG' && key !== 'fiberG' && value > target ? 'warning' : tone}
                    label={t(label)}
                  >
                    <span className="nutri-macro-pct num">{Math.round(Math.min(value / Math.max(target, 1), 9.99) * 100)}%</span>
                  </ProgressRing>
                ) : null}
                <div className="nutri-macro-text">
                  <span className="nutri-macro-label">{t(label)}</span>
                  <span className="num nutri-macro-value">
                    {target != null ? t('nutrition.overview.macroOfTarget', { value: f.g(value), target: f.g(target) }) : f.gramsText(value)}
                  </span>
                  {left != null && (
                    <span className="small muted">
                      {Math.abs(left) < 0.5
                        ? t('nutrition.overview.macroReached')
                        : left > 0
                          ? t('nutrition.overview.macroLeft', { value: f.g(left) })
                          : key === 'proteinG' || key === 'fiberG'
                            ? t('nutrition.overview.macroReached')
                            : t('nutrition.overview.macroOver', { value: f.g(-left) })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {!targets && (
        <Notice tone="info" title={t('nutrition.overview.noTargetsTitle')}>
          <p>{t('nutrition.overview.noTargetsBody')}</p>
          <LinkButton to="/profile" size="sm" variant="secondary" icon="user">
            {t('nutrition.overview.completeProfile')}
          </LinkButton>
        </Notice>
      )}
      {targets && minor && <p className="small muted nutri-minor-note">{t('nutrition.overview.minorNote')}</p>}
      {targets && <TargetsInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} targets={targets} minor={minor} />}
    </Card>
  );
}

function targetFor(t: NutritionTargetsDTO, key: MacroKey): number {
  return key === 'proteinG' ? t.proteinG : key === 'carbsG' ? t.carbsG : key === 'fatG' ? t.fatG : t.fiberG;
}

function TargetsInfoModal({ open, onClose, targets, minor }: { open: boolean; onClose(): void; targets: NutritionTargetsDTO; minor: boolean }) {
  const { t, tx } = useI18n();
  const f = useMacroFormat();
  const c = targets.computed;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('nutrition.targetsInfo.title')}
      footer={
        <>
          <LinkButton to="/profile" variant="secondary" icon="settings">
            {t('nutrition.overview.adjustTargets')}
          </LinkButton>
          <Button variant="primary" onClick={onClose}>
            {t('common.actions.close')}
          </Button>
        </>
      }
    >
      <div className="stack">
        <p>{minor ? t('nutrition.targetsInfo.introMinor') : t('nutrition.targetsInfo.intro')}</p>
        {targets.custom && <Notice tone="info">{t('nutrition.targetsInfo.custom')}</Notice>}
        {c ? (
          <dl className="kv">
            <dt>{t('nutrition.targetsInfo.bmr')}</dt>
            <dd className="num">{f.kcalText(c.bmr)}</dd>
            <dt>{t('nutrition.targetsInfo.tdee')}</dt>
            <dd className="num">{f.kcalText(c.tdee)}</dd>
            <dt>{t('nutrition.targetsInfo.calories')}</dt>
            <dd className="num">{f.kcalText(targets.calories)}</dd>
            {!minor && (
              <>
                <dt>{t('nutrition.targetsInfo.minimum')}</dt>
                <dd className="num">{f.kcalText(c.minimumCalories)}</dd>
              </>
            )}
            <dt>{t('nutrition.targetsInfo.protein')}</dt>
            <dd className="num">{f.gramsText(targets.proteinG)}</dd>
            <dt>{t('nutrition.targetsInfo.carbs')}</dt>
            <dd className="num">{f.gramsText(targets.carbsG)}</dd>
            <dt>{t('nutrition.targetsInfo.fat')}</dt>
            <dd className="num">{f.gramsText(targets.fatG)}</dd>
            <dt>{t('nutrition.targetsInfo.fiber')}</dt>
            <dd className="num">{f.gramsText(targets.fiberG)}</dd>
          </dl>
        ) : (
          <p className="muted">{t('nutrition.targetsInfo.unavailable')}</p>
        )}
        {c && c.notes.length > 0 && (
          <section>
            <h3 className="section-title">{t('nutrition.targetsInfo.notes')}</h3>
            <ul className="nutri-notes">
              {c.notes.map((n) => (
                <li key={n}>{tx(`enums.targetNote.${n}`)}</li>
              ))}
            </ul>
          </section>
        )}
        <p className="small muted">{t('nutrition.targetsInfo.disclaimer')}</p>
      </div>
    </Modal>
  );
}
