-- "Accept all" for an AI finance proposal used to write each line type (startup costs, recurring
-- expenses, revenue streams) and the starting capital as separate requests. A failure part-way
-- left some items saved and others not. accept_finance_proposal() writes everything the user
-- accepted in ONE transaction: either every accepted item (and the starting capital) is saved, or
-- nothing is. Each line carries its source_ref idempotency key, so a retry after a lost response
-- or a second tap never duplicates a line.
--
-- p_lines: jsonb array (max 50) of
--   { "kind": "startup",  "label", "category", "amount_minor",                     "source_ref" }
--   { "kind": "expense",  "label", "category", "monthly_amount_minor",             "source_ref" }
--   { "kind": "revenue",  "label", "unit_price_minor", "unit_variable_cost_minor",
--                         "monthly_units", "monthly_growth_pct",                    "source_ref" }
-- p_starting_capital_minor: null to leave the starting capital unchanged.
--
-- Every line is stored with basis 'ai_estimate' (it came from the AI). SECURITY INVOKER: RLS,
-- CHECK constraints and the existing triggers apply; any violation rolls the whole call back.

create or replace function public.accept_finance_proposal(
  p_business_id uuid,
  p_lines jsonb,
  p_starting_capital_minor bigint default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_line jsonb;
  v_kind text;
  v_ref text;
  v_id uuid;
  v_inserted integer := 0;
  v_skipped integer := 0;
  v_next_startup integer;
  v_next_expense integer;
  v_next_revenue integer;
begin
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'p_lines must be an array';
  end if;
  if jsonb_array_length(p_lines) > 50 then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'too many lines';
  end if;
  if jsonb_array_length(p_lines) = 0 and p_starting_capital_minor is null then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'nothing to accept';
  end if;

  perform 1 from public.businesses b where b.id = p_business_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0001', detail = 'business';
  end if;

  -- Serialise acceptances for this business (two devices / double tap): the second waits, then
  -- finds the source_refs already present and skips them.
  perform pg_advisory_xact_lock(hashtext('accept_finance_proposal:' || p_business_id::text));

  select coalesce(max(s.sort_order) + 1, 0) into v_next_startup from public.startup_costs s where s.business_id = p_business_id;
  select coalesce(max(r.sort_order) + 1, 0) into v_next_expense from public.recurring_expenses r where r.business_id = p_business_id;
  select coalesce(max(v.sort_order) + 1, 0) into v_next_revenue from public.revenue_streams v where v.business_id = p_business_id;

  for v_line in select value from jsonb_array_elements(p_lines) loop
    v_kind := v_line ->> 'kind';
    v_ref := nullif(btrim(coalesce(v_line ->> 'source_ref', '')), '');
    if v_ref is null then
      -- Proposal lines must be idempotent; refusing here keeps "Accept all" safe to retry.
      raise exception 'invalid_request' using errcode = 'P0001', detail = 'every proposal line needs a source_ref';
    end if;
    v_id := null;

    case v_kind
      when 'startup' then
        insert into public.startup_costs (business_id, label, category, amount_minor, basis, source_ref, sort_order)
        values (
          p_business_id,
          btrim(coalesce(v_line ->> 'label', '')),
          btrim(coalesce(v_line ->> 'category', '')),
          (v_line ->> 'amount_minor')::bigint,
          'ai_estimate',
          v_ref,
          v_next_startup
        )
        on conflict (business_id, source_ref) do nothing
        returning id into v_id;
        if v_id is not null then v_next_startup := v_next_startup + 1; end if;

      when 'expense' then
        insert into public.recurring_expenses (business_id, label, category, monthly_amount_minor, basis, source_ref, sort_order)
        values (
          p_business_id,
          btrim(coalesce(v_line ->> 'label', '')),
          btrim(coalesce(v_line ->> 'category', '')),
          (v_line ->> 'monthly_amount_minor')::bigint,
          'ai_estimate',
          v_ref,
          v_next_expense
        )
        on conflict (business_id, source_ref) do nothing
        returning id into v_id;
        if v_id is not null then v_next_expense := v_next_expense + 1; end if;

      when 'revenue' then
        insert into public.revenue_streams (
          business_id, label, unit_price_minor, unit_variable_cost_minor, monthly_units, monthly_growth_pct,
          basis, source_ref, sort_order
        )
        values (
          p_business_id,
          btrim(coalesce(v_line ->> 'label', '')),
          (v_line ->> 'unit_price_minor')::bigint,
          (v_line ->> 'unit_variable_cost_minor')::bigint,
          (v_line ->> 'monthly_units')::numeric,
          (v_line ->> 'monthly_growth_pct')::numeric,
          'ai_estimate',
          v_ref,
          v_next_revenue
        )
        on conflict (business_id, source_ref) do nothing
        returning id into v_id;
        if v_id is not null then v_next_revenue := v_next_revenue + 1; end if;

      else
        raise exception 'invalid_request' using errcode = 'P0001', detail = 'unknown line kind: ' || coalesce(v_kind, 'null');
    end case;

    if v_id is null then
      v_skipped := v_skipped + 1;
    else
      v_inserted := v_inserted + 1;
    end if;
  end loop;

  if p_starting_capital_minor is not null then
    perform public.ensure_financial_model(p_business_id);
    update public.financial_models
    set starting_capital_minor = p_starting_capital_minor
    where business_id = p_business_id;
  end if;

  return jsonb_build_object(
    'inserted', v_inserted,
    'skipped', v_skipped,
    'starting_capital_applied', p_starting_capital_minor is not null
  );
end;
$$;

comment on function public.accept_finance_proposal(uuid, jsonb, bigint) is
  'Accepts AI finance proposal items atomically: inserts every line (basis ai_estimate, idempotent by source_ref) and optionally sets the starting capital, all in one transaction. Returns {inserted, skipped, starting_capital_applied}.';

revoke all on function public.accept_finance_proposal(uuid, jsonb, bigint) from public, anon;
grant execute on function public.accept_finance_proposal(uuid, jsonb, bigint) to authenticated, service_role;
