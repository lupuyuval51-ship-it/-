import { OnboardingValueSchemas } from '@domain/onboarding';
import { hasTranslation } from '@/i18n/translate';
import { draftDiffers, fieldMax, initialFields, stepSchemas } from '../forms';

function issues(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return (result.error?.issues ?? []).map((i) => ({ path: i.path.join('.'), message: i.message }));
}

describe('step schemas', () => {
  it('business_idea: requires 3+ chars, trims, drops an empty working name', () => {
    expect(stepSchemas.business_idea.safeParse({ idea: '  Bakery  ', name: '  ' }).data).toEqual({ idea: 'Bakery' });
    expect(stepSchemas.business_idea.safeParse({ idea: 'Bakery', name: ' Crumb ' }).data).toEqual({ idea: 'Bakery', name: 'Crumb' });
    const bad = stepSchemas.business_idea.safeParse({ idea: 'ab', name: '' });
    expect(issues(bad)).toEqual([{ path: 'idea', message: 'onboarding.errors.ideaTooShort' }]);
    expect(issues(stepSchemas.business_idea.safeParse({ idea: 'x'.repeat(4001), name: '' }))[0]?.message).toBe('errors.field.tooLong');
  });

  it('country: requires an ISO-2 code', () => {
    expect(stepSchemas.country.safeParse({ code: 'IL' }).data).toEqual({ code: 'IL' });
    expect(issues(stepSchemas.country.safeParse({ code: '' }))[0]?.message).toBe('onboarding.errors.countryRequired');
  });

  it('starting_budget: parses money into minor units, distinguishes empty and invalid', () => {
    expect(stepSchemas.starting_budget.safeParse({ amount: '₪ 12,500', currency: 'ILS' }).data).toEqual({
      amount_minor: 1_250_000,
      currency: 'ILS',
    });
    expect(stepSchemas.starting_budget.safeParse({ amount: '0', currency: 'USD' }).data).toEqual({ amount_minor: 0, currency: 'USD' });
    expect(issues(stepSchemas.starting_budget.safeParse({ amount: ' ', currency: 'ILS' }))).toEqual([
      { path: 'amount', message: 'onboarding.errors.amountRequired' },
    ]);
    expect(issues(stepSchemas.starting_budget.safeParse({ amount: '1a2', currency: 'ILS' }))).toEqual([
      { path: 'amount', message: 'errors.field.amountInvalid' },
    ]);
  });

  it('choice steps require a known option and keep optional details only when present', () => {
    expect(stepSchemas.experience.safeParse({ level: 'founder', details: '' }).data).toEqual({ level: 'founder' });
    expect(stepSchemas.experience.safeParse({ level: 'some', details: ' a bit ' }).data).toEqual({ level: 'some', details: 'a bit' });
    expect(issues(stepSchemas.experience.safeParse({ level: '', details: '' }))[0]).toEqual({
      path: 'level',
      message: 'onboarding.errors.chooseOne',
    });
    expect(stepSchemas.primary_goal.safeParse({ goal: 'scale', details: '' }).data).toEqual({ goal: 'scale' });
    expect(stepSchemas.weekly_hours.safeParse({ range: 'gt40' }).data).toEqual({ range: 'gt40' });
    expect(stepSchemas.weekly_hours.safeParse({ range: 'h99' }).success).toBe(false);
    expect(stepSchemas.launch_timeline.safeParse({ timeline: 'unsure' }).data).toEqual({ timeline: 'unsure' });
  });

  it('target_customers: requires text', () => {
    expect(issues(stepSchemas.target_customers.safeParse({ text: '   ' }))[0]?.message).toBe('onboarding.errors.customersRequired');
  });

  it('every output is accepted by the domain schema', () => {
    const outputs = {
      business_idea: stepSchemas.business_idea.parse({ idea: 'Bakery', name: 'Crumb' }),
      country: stepSchemas.country.parse({ code: 'PT' }),
      starting_budget: stepSchemas.starting_budget.parse({ amount: '1000.5', currency: 'EUR' }),
      experience: stepSchemas.experience.parse({ level: 'none', details: 'x' }),
      target_customers: stepSchemas.target_customers.parse({ text: 'Parents' }),
      primary_goal: stepSchemas.primary_goal.parse({ goal: 'other', details: 'y' }),
      weekly_hours: stepSchemas.weekly_hours.parse({ range: 'lt5' }),
      launch_timeline: stepSchemas.launch_timeline.parse({ timeline: 'm3' }),
    };
    for (const [key, value] of Object.entries(outputs)) {
      expect(OnboardingValueSchemas[key as keyof typeof outputs].safeParse(value).success).toBe(true);
    }
  });

  it('every error message is a real translation key', () => {
    const samples = [
      stepSchemas.business_idea.safeParse({ idea: '', name: 'x'.repeat(200) }),
      stepSchemas.country.safeParse({ code: 'x' }),
      stepSchemas.starting_budget.safeParse({ amount: '', currency: 'ILS' }),
      stepSchemas.starting_budget.safeParse({ amount: 'x', currency: 'bad' }),
      stepSchemas.experience.safeParse({ level: 'x', details: 'y'.repeat(2000) }),
      stepSchemas.target_customers.safeParse({ text: '' }),
    ];
    for (const s of samples) for (const i of issues(s)) expect(hasTranslation(i.message)).toBe(true);
  });
});

describe('initialFields', () => {
  const defaults = { countryCode: 'IL', currency: 'ILS' };

  it('defaults from the business when nothing is saved', () => {
    expect(initialFields('country', null, undefined, defaults)).toEqual({ code: 'IL' });
    expect(initialFields('starting_budget', null, undefined, defaults)).toEqual({ amount: '', currency: 'ILS' });
    expect(initialFields('experience', null, undefined, defaults)).toEqual({ level: '', details: '' });
  });

  it('shows saved answers, and a draft wins over them field by field', () => {
    const saved = { amount_minor: 123_450, currency: 'USD' };
    expect(initialFields('starting_budget', saved, undefined, defaults)).toEqual({ amount: '1234.50', currency: 'USD' });
    expect(initialFields('starting_budget', saved, { amount: '2000' }, defaults)).toEqual({ amount: '2000', currency: 'USD' });
    expect(initialFields('business_idea', { idea: 'Old idea', name: 'N' }, { idea: 'New idea typing' }, defaults)).toEqual({
      idea: 'New idea typing',
      name: 'N',
    });
  });

  it('draftDiffers detects meaningful unsaved changes only', () => {
    const saved = { text: 'Parents' };
    expect(draftDiffers('target_customers', saved, undefined, defaults)).toBe(false);
    expect(draftDiffers('target_customers', saved, { text: 'Parents ' }, defaults)).toBe(false);
    expect(draftDiffers('target_customers', saved, { text: 'Parents in Haifa' }, defaults)).toBe(true);
  });

  it('fieldMax knows the length limits', () => {
    expect(fieldMax('idea')).toBe(4000);
    expect(fieldMax('details')).toBe(1000);
    expect(fieldMax('code')).toBeUndefined();
  });
});
