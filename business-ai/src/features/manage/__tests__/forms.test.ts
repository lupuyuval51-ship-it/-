import {
  goalFormDefaults,
  goalFormSchema,
  parseDecimal,
  parseGoalForm,
  parseTransactionForm,
  transactionFormDefaults,
  transactionFormSchema,
  type GoalFormValues,
  type TransactionFormValues,
} from '../forms';

const tx = (partial: Partial<TransactionFormValues> = {}): TransactionFormValues => ({
  kind: 'income',
  amount: '1,250.50',
  occurredOn: '2026-11-05',
  category: '  Sales  ',
  note: ' first order ',
  ...partial,
});

const goal = (partial: Partial<GoalFormValues> = {}): GoalFormValues => ({
  title: ' First  revenue ',
  metric: 'revenue',
  target: '10,000',
  current: '',
  unit: 'ignored',
  dueDate: '2026-12-31',
  status: 'active',
  ...partial,
});

function issues(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return Object.fromEntries((result.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]));
}

describe('transaction form', () => {
  const schema = transactionFormSchema('ILS');

  it('parses money into positive minor units and cleans text', () => {
    expect(schema.safeParse(tx()).success).toBe(true);
    expect(parseTransactionForm(tx(), 'ILS')).toEqual({
      kind: 'income',
      amount_minor: 125050,
      occurred_on: '2026-11-05',
      category: 'Sales',
      note: 'first order',
    });
  });

  it('rejects empty, zero, invalid amounts and missing dates', () => {
    expect(issues(schema.safeParse(tx({ amount: '' })))).toEqual({ amount: 'errors.field.required' });
    expect(issues(schema.safeParse(tx({ amount: '0' })))).toEqual({ amount: 'manage.validation.amountPositive' });
    expect(issues(schema.safeParse(tx({ amount: '-5' })))).toEqual({ amount: 'errors.field.amountInvalid' });
    expect(issues(schema.safeParse(tx({ amount: '12a3' })))).toEqual({ amount: 'errors.field.amountInvalid' });
    expect(issues(schema.safeParse(tx({ occurredOn: null })))).toEqual({ occurredOn: 'manage.validation.dateRequired' });
    expect(parseTransactionForm(tx({ amount: '0' }), 'ILS')).toBeNull();
  });

  it('enforces DB length limits', () => {
    expect(issues(schema.safeParse(tx({ category: 'x'.repeat(61) })))).toEqual({ category: 'manage.validation.categoryTooLong' });
    expect(issues(schema.safeParse(tx({ note: 'x'.repeat(501) })))).toEqual({ note: 'manage.validation.noteTooLong' });
  });

  it('round-trips an existing row', () => {
    const values = transactionFormDefaults(
      { kind: 'expense', amount_minor: 99_90, occurred_on: '2026-10-01', category: 'Rent', note: '' },
      '2026-11-05',
    );
    expect(values).toEqual({ kind: 'expense', amount: '99.90', occurredOn: '2026-10-01', category: 'Rent', note: '' });
    expect(parseTransactionForm(values, 'ILS')?.amount_minor).toBe(99_90);
    expect(transactionFormDefaults(undefined, '2026-11-05', 'expense')).toMatchObject({ kind: 'expense', occurredOn: '2026-11-05' });
  });
});

describe('goal form', () => {
  const schema = goalFormSchema('ILS');

  it('stores money targets in minor units and drops manual fields', () => {
    expect(schema.safeParse(goal()).success).toBe(true);
    expect(parseGoalForm(goal({ current: '5' }), 'ILS')).toEqual({
      title: 'First revenue',
      metric: 'revenue',
      target_value: 1_000_000,
      current_value: 0,
      unit: '',
      due_date: '2026-12-31',
      status: 'active',
    });
  });

  it('stores manual metrics as decimals', () => {
    expect(parseGoalForm(goal({ metric: 'customers', target: '40', current: '12.5', unit: ' clients ', dueDate: null }), 'ILS')).toMatchObject({
      target_value: 40,
      current_value: 12.5,
      unit: 'clients',
      due_date: null,
    });
    expect(parseGoalForm(goal({ metric: 'custom', target: '3', current: '' }), 'ILS')?.current_value).toBe(0);
  });

  it('validates required and malformed fields', () => {
    expect(issues(schema.safeParse(goal({ title: '   ', target: '' })))).toEqual({
      title: 'errors.field.required',
      target: 'errors.field.required',
    });
    expect(issues(schema.safeParse(goal({ metric: 'customers', target: 'abc', current: 'x' })))).toEqual({
      target: 'manage.validation.targetInvalid',
      current: 'manage.validation.currentInvalid',
    });
    expect(issues(schema.safeParse(goal({ title: 'x'.repeat(201) })))).toEqual({ title: 'manage.validation.titleTooLong' });
    expect(issues(schema.safeParse(goal({ metric: 'custom', unit: 'x'.repeat(21) })))).toEqual({ unit: 'manage.validation.unitTooLong' });
  });

  it('round-trips existing goals', () => {
    const money = goalFormDefaults({ title: 'R', metric: 'profit', target_value: 250_050, current_value: 0, unit: '', due_date: null, status: 'achieved' });
    expect(money).toMatchObject({ metric: 'profit', target: '2500.50', current: '', status: 'achieved' });
    expect(parseGoalForm(money, 'ILS')?.target_value).toBe(250_050);
    const manual = goalFormDefaults({ title: 'C', metric: 'customers', target_value: 40, current_value: 7, unit: 'x', due_date: '2026-12-01', status: 'weird' });
    expect(manual).toMatchObject({ target: '40', current: '7', status: 'active' });
  });

  it('parses decimals', () => {
    expect(parseDecimal('1,200')).toBe(1200);
    expect(parseDecimal('12,5')).toBe(12.5);
    expect(parseDecimal('-1')).toBeNull();
    expect(parseDecimal('')).toBeNull();
  });
});
