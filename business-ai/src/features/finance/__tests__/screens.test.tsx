/**
 * (jest.mock calls below are hoisted above these imports.)
 * Smoke tests for the finance screens with the data layer mocked: headline estimates, empty
 * state, proposal notice and the forecast table (Hebrew / RTL and English).
 */
import { fireEvent, screen } from '@testing-library/react-native';
import { DEFAULT_SCENARIOS, forecast, type FinanceInputs } from '@domain/finance';
import { stripBidi } from '@/i18n/format';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ForecastTable } from '../components/ForecastTable';
import { useFinanceFormat } from '../hooks';
import FinanceScreen from '../screens/FinanceScreen';
import LineEditorScreen from '../screens/LineEditorScreen';
import { mapModelRow, toFinanceInputs, type FinanceLines, type FinancialModelRow, type ProposalItem } from '../mapping';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
const mockParams: { kind?: string; id?: string } = {};
const mockCreate = jest.fn((_draft: unknown) => Promise.resolve('new-id'));
jest.mock('expo-router', () => ({
  get router() {
    return mockRouter;
  },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockParams,
}));

interface MockState {
  model: FinancialModelRow;
  lines: FinanceLines;
  pending: ProposalItem[];
}
const mockState: MockState = { model: {} as FinancialModelRow, lines: { startupCosts: [], recurringExpenses: [], revenueStreams: [] }, pending: [] };

function mockInputs(): FinanceInputs {
  return toFinanceInputs(mockState.model, mockState.lines);
}

jest.mock('@/features/business/api', () => ({
  useActiveBusiness: () => ({ businessId: 'b1', business: null, businesses: [], isLoading: false, error: null, refetch: () => undefined }),
  useBusinesses: () => ({ data: [] }),
}));

jest.mock('@/features/settings/api', () => ({
  useEntitlement: () => ({ tier: 'free', limits: { maxForecastMonths: 12 }, entitlement: null, isLoading: false, error: null, refetch: () => undefined }),
}));

jest.mock('../api', () => {
  const idle = () => ({ mutate: jest.fn(), mutateAsync: jest.fn(), reset: jest.fn(), isPending: false, error: null });
  return {
    useFinanceInputs: () => ({
      inputs: mockInputs(),
      model: mockState.model,
      lines: mockState.lines,
      currency: 'ILS',
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: jest.fn(),
    }),
    useFinanceSummary: (_id: string, scenario: 'conservative' | 'expected' | 'optimistic') =>
      (jest.requireActual('@domain/finance') as typeof import('@domain/finance')).summarize(mockInputs(), scenario),
    useActiveProposal: () => ({ proposal: null, source: null, pending: mockState.pending, isLoading: false, error: null, refetch: jest.fn() }),
    useProposeAssumptions: idle,
    useUpdateFinancialModel: idle,
    useCreateFinanceLine: () => ({ ...idle(), mutateAsync: mockCreate }),
    useUpdateFinanceLine: idle,
    useDeleteFinanceLine: idle,
  };
});


const NOW = '2026-11-05T10:00:00Z';

function setModel(overrides: Partial<FinancialModelRow> = {}) {
  mockState.model = mapModelRow({
    business_id: 'b1',
    starting_capital_minor: 0,
    forecast_months: 12,
    conservative_volume_pct: DEFAULT_SCENARIOS.conservative.volumePct,
    conservative_price_pct: DEFAULT_SCENARIOS.conservative.pricePct,
    conservative_cost_pct: DEFAULT_SCENARIOS.conservative.costPct,
    optimistic_volume_pct: DEFAULT_SCENARIOS.optimistic.volumePct,
    optimistic_price_pct: DEFAULT_SCENARIOS.optimistic.pricePct,
    optimistic_cost_pct: DEFAULT_SCENARIOS.optimistic.costPct,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  });
}

function cafeLines(): FinanceLines {
  return {
    startupCosts: [{ kind: 'startup', id: 's1', label: 'Equipment', amountMinor: 2_500_000, category: '', basis: 'user_provided', sortOrder: 0 }],
    recurringExpenses: [{ kind: 'expense', id: 'e1', label: 'Rent', monthlyAmountMinor: 450_000, category: '', basis: 'assumption', sortOrder: 0 }],
    revenueStreams: [
      {
        kind: 'revenue',
        id: 'r1',
        label: 'Coffee',
        unitPriceMinor: 2_000,
        unitVariableCostMinor: 800,
        monthlyUnits: 300,
        monthlyGrowthPct: 10,
        basis: 'ai_estimate',
        sortOrder: 0,
      },
    ],
  };
}

const text = (testID: string) => stripBidi(String(screen.getByTestId(testID).props.accessibilityLabel ?? ''));

beforeEach(() => {
  mockRouter.push.mockClear();
  mockState.pending = [];
});

describe('FinanceScreen', () => {
  it('shows the empty state with one primary action and the AI option', async () => {
    setModel();
    mockState.lines = { startupCosts: [], recurringExpenses: [], revenueStreams: [] };
    await renderWithProviders(<FinanceScreen />, { locale: 'en' });
    expect(screen.getByText('Build your financial model')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('finance-add-first-stream'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/finance/line/[kind]/[id]', params: { kind: 'revenue', id: 'new' } });
    expect(screen.getByTestId('finance-ask-ai')).toBeTruthy();
  });

  it('renders headline estimates from the engine (English)', async () => {
    setModel({ starting_capital_minor: 5_000_000, forecast_months: 6 });
    mockState.lines = cafeLines();
    await renderWithProviders(<FinanceScreen />, { locale: 'en' });
    expect(screen.getByText('Estimates based on your assumptions, not a guarantee of results.')).toBeTruthy();
    expect(text('finance-figure-opening')).toContain('₪25,000');
    expect(text('finance-figure-fixed')).toContain('₪4,500');
    expect(text('finance-figure-revenue')).toContain('₪6,000');
    // Break-even: 450,000 × 2,000 / 1,200 = 750,000 → ₪7,500; units: ceil(450,000 / 1,200) = 375.
    expect(text('finance-figure-breakeven')).toContain('₪7,500');
    expect(text('finance-figure-breakeven')).toContain('About 375 units a month');
    expect(text('finance-figure-runway')).toContain('Cash lasts the whole forecast');
  });

  it('shows the proposal notice and switches scenarios (Hebrew)', async () => {
    setModel({ starting_capital_minor: 0 });
    mockState.lines = cafeLines();
    mockState.pending = [{ key: 'capital:x', kind: 'capital', amountMinor: 100 }];
    await renderWithProviders(<FinanceScreen />, { locale: 'he' });
    expect(screen.getByTestId('finance-proposal-notice')).toBeTruthy();
    expect(screen.getByText('ה־AI הציע הנחות פתיחה')).toBeTruthy();
    // Opening cash −25,000 → cash is already negative at the start.
    expect(text('finance-figure-runway')).toContain('מזומן הפתיחה כבר שלילי');
    await fireEvent.press(screen.getByTestId('finance-scenario-conservative'));
    expect(text('finance-figure-fixed')).toContain('4,950'); // 450,000 × 110%
  });
});

describe('ForecastTable', () => {
  it('renders every month plus opening and total rows, with readable row labels', async () => {
    setModel({ starting_capital_minor: 100_000, forecast_months: 3 });
    mockState.lines = cafeLines();
    const f = forecast(mockInputs(), 'expected');
    function Harness() {
      const format = useFinanceFormat('ILS');
      return <ForecastTable forecast={f} format={format} labels="relative" start={new Date(2026, 10, 5)} />;
    }
    await renderWithProviders(<Harness />, { locale: 'en' });
    expect(screen.getByTestId('finance-forecast-table')).toBeTruthy();
    expect(screen.getByText('Opening')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getAllByLabelText(/^\W*Month\W+\d+\W*:/).length).toBe(3);
  });
});

describe('LineEditorScreen', () => {
  it('validates, shows live unit economics and saves a parsed revenue stream', async () => {
    setModel();
    mockState.lines = { startupCosts: [], recurringExpenses: [], revenueStreams: [] };
    mockParams.kind = 'revenue';
    mockParams.id = 'new';
    mockCreate.mockClear();
    await renderWithProviders(<LineEditorScreen />, { locale: 'en' });

    await fireEvent.press(screen.getByTestId('finance-line-save'));
    expect(await screen.findAllByText('Required')).toHaveLength(2); // name + price
    expect(mockCreate).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('finance-line-label'), 'Coffee');
    await fireEvent.changeText(screen.getByTestId('finance-line-price'), '20');
    await fireEvent.changeText(screen.getByTestId('finance-line-cost'), '8');
    await fireEvent.changeText(screen.getByTestId('finance-line-units'), '300');
    const metrics = screen
      .getAllByLabelText(/Gross margin|Contribution per unit|Markup on cost/)
      .map((n) => stripBidi(String(n.props.accessibilityLabel)))
      .join('|');
    expect(metrics).toContain('Gross margin, 60%');
    expect(metrics).toContain('Contribution per unit, ₪12');
    expect(metrics).toContain('Markup on cost, 150%');

    await fireEvent.press(screen.getByTestId('finance-line-save'));
    expect(mockCreate).toHaveBeenCalledWith({
      kind: 'revenue',
      label: 'Coffee',
      unitPriceMinor: 2000,
      unitVariableCostMinor: 800,
      monthlyUnits: 300,
      monthlyGrowthPct: 0,
      basis: 'user_provided',
    });
  });
});
