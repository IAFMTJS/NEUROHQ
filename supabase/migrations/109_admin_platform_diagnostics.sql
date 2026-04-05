-- Aggregated platform diagnostics for admin UI. Callable only when public.users.role = 'admin' for auth.uid().
-- Uses SECURITY DEFINER so aggregates can read all rows without per-table admin RLS on every table.

create or replace function public.admin_platform_diagnostics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  since date := (current_date - interval '30 days')::date;
  since_ts timestamptz := since::timestamptz;
begin
  if not public.current_user_is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'generated_at', to_jsonb(now() at time zone 'utc'),
    'window_days', 30,
    'since_date', to_jsonb(since),
    'users', (
      select jsonb_build_object(
        'total', (select count(*)::int from public.users),
        'with_timezone', (
          select count(*)::int from public.users
          where timezone is not null and length(trim(timezone)) > 0
        )
      )
    ),
    'tasks', (
      select jsonb_build_object(
        'total_active', (select count(*)::int from public.tasks where deleted_at is null),
        'completed_total', (select count(*)::int from public.tasks where deleted_at is null and completed),
        'open_total', (select count(*)::int from public.tasks where deleted_at is null and not completed),
        'completed_last_30d', (
          select count(*)::int from public.tasks
          where deleted_at is null and completed and completed_at is not null and completed_at >= since_ts
        ),
        'created_last_30d', (
          select count(*)::int from public.tasks
          where deleted_at is null and (created_at::date >= since)
        ),
        'open_with_carry_over', (
          select count(*)::int from public.tasks
          where deleted_at is null and not completed and carry_over_count > 0
        ),
        'avg_carry_over_on_open', (
          select round(coalesce(avg(carry_over_count), 0)::numeric, 3)
          from public.tasks where deleted_at is null and not completed
        ),
        'avg_carry_over_on_carried_open', (
          select round(coalesce(avg(carry_over_count), 0)::numeric, 3)
          from public.tasks
          where deleted_at is null and not completed and carry_over_count > 0
        ),
        'max_carry_over_seen', (
          select coalesce(max(carry_over_count), 0)::int from public.tasks where deleted_at is null
        ),
        'distinct_users_completed_30d', (
          select count(distinct user_id)::int from public.tasks
          where deleted_at is null and completed and completed_at is not null and completed_at >= since_ts
        ),
        'avg_completions_per_active_user_30d', (
          select case
            when d.n = 0 then 0::numeric
            else round((c.n::numeric / d.n::numeric), 3)
          end
          from
            (select count(*)::int as n from public.tasks
             where deleted_at is null and completed and completed_at is not null and completed_at >= since_ts) c,
            (select count(distinct user_id)::int as n from public.tasks
             where deleted_at is null and completed and completed_at is not null and completed_at >= since_ts) d
        )
      )
    ),
    'budget_entries', (
      select jsonb_build_object(
        'total_rows', (select count(*)::int from public.budget_entries),
        'rows_last_30d', (select count(*)::int from public.budget_entries where date >= since),
        'income_rows_last_30d', (
          select count(*)::int from public.budget_entries
          where date >= since and amount_cents > 0
        ),
        'expense_rows_last_30d', (
          select count(*)::int from public.budget_entries
          where date >= since and amount_cents < 0
        ),
        'distinct_users_ever', (select count(distinct user_id)::int from public.budget_entries),
        'distinct_users_last_30d', (
          select count(distinct user_id)::int from public.budget_entries where date >= since
        ),
        'avg_expense_cents_last_30d', (
          select round(coalesce(avg(amount_cents), 0)::numeric, 2)
          from public.budget_entries
          where date >= since and amount_cents < 0
        ),
        'avg_income_cents_last_30d', (
          select round(coalesce(avg(amount_cents), 0)::numeric, 2)
          from public.budget_entries
          where date >= since and amount_cents > 0
        )
      )
    ),
    'daily_state', (
      select jsonb_build_object(
        'rows_last_30d', (select count(*)::int from public.daily_state where date >= since),
        'distinct_users_last_30d', (
          select count(distinct user_id)::int from public.daily_state where date >= since
        )
      )
    ),
    'learning_sessions', (
      select jsonb_build_object(
        'rows_last_30d', (select count(*)::int from public.learning_sessions where date >= since),
        'distinct_users_last_30d', (
          select count(distinct user_id)::int from public.learning_sessions where date >= since
        ),
        'total_minutes_last_30d', (
          select coalesce(sum(minutes), 0)::bigint from public.learning_sessions where date >= since
        ),
        'avg_minutes_per_session_last_30d', (
          select round(coalesce(avg(minutes), 0)::numeric, 2)
          from public.learning_sessions where date >= since
        )
      )
    ),
    'xp_events', (
      select jsonb_build_object(
        'rows_last_30d', (select count(*)::int from public.xp_events where created_at >= since_ts),
        'distinct_users_last_30d', (
          select count(distinct user_id)::int from public.xp_events where created_at >= since_ts
        ),
        'total_xp_last_30d', (
          select coalesce(sum(amount), 0)::bigint from public.xp_events where created_at >= since_ts
        ),
        'avg_xp_per_event_last_30d', (
          select round(coalesce(avg(amount), 0)::numeric, 2)
          from public.xp_events where created_at >= since_ts
        )
      )
    ),
    'behaviour_log', (
      select jsonb_build_object(
        'completions_last_30d', (
          select count(*)::int from public.behaviour_log
          where mission_completed_at is not null and mission_completed_at >= since_ts
        ),
        'distinct_users_completions_30d', (
          select count(distinct user_id)::int from public.behaviour_log
          where mission_completed_at is not null and mission_completed_at >= since_ts
        )
      )
    ),
    'missions', (
      select jsonb_build_object(
        'completed_last_30d', (
          select count(*)::int from public.missions
          where completed and completed_at is not null and completed_at >= since_ts
        ),
        'distinct_users_completed_30d', (
          select count(distinct user_id)::int from public.missions
          where completed and completed_at is not null and completed_at >= since_ts
        )
      )
    ),
    'user_analytics_daily', (
      select jsonb_build_object(
        'rows_last_30d', (select count(*)::int from public.user_analytics_daily where date >= since),
        'distinct_users_last_30d', (
          select count(distinct user_id)::int from public.user_analytics_daily where date >= since
        )
      )
    ),
    'per_user', coalesce(
      (
        with
        task_u as (
          select user_id, count(*)::int as c
          from public.tasks
          where deleted_at is null and completed and completed_at is not null and completed_at >= since_ts
          group by user_id
        ),
        budget_u as (
          select user_id, count(*)::int as c
          from public.budget_entries
          where date >= since
          group by user_id
        ),
        state_u as (
          select user_id, count(*)::int as c
          from public.daily_state
          where date >= since
          group by user_id
        ),
        xp_u as (
          select user_id, count(*)::int as c, coalesce(sum(amount), 0)::bigint as xp_sum
          from public.xp_events
          where created_at >= since_ts
          group by user_id
        ),
        learn_u as (
          select user_id, coalesce(sum(minutes), 0)::int as m
          from public.learning_sessions
          where date >= since
          group by user_id
        ),
        beh_u as (
          select user_id, count(*)::int as c
          from public.behaviour_log
          where mission_completed_at is not null and mission_completed_at >= since_ts
          group by user_id
        ),
        carry_u as (
          select user_id, count(*)::int as open_carried
          from public.tasks
          where deleted_at is null and not completed and carry_over_count > 0
          group by user_id
        ),
        scores as (
          select
            u.id as user_id,
            u.email,
            coalesce(t.c, 0) as tasks_done_30d,
            coalesce(b.c, 0) as budget_rows_30d,
            coalesce(d.c, 0) as daily_state_rows_30d,
            coalesce(x.c, 0) as xp_events_30d,
            coalesce(x.xp_sum, 0::bigint) as xp_sum_30d,
            coalesce(l.m, 0) as learning_minutes_30d,
            coalesce(h.c, 0) as behaviour_completions_30d,
            coalesce(cr.open_carried, 0) as open_tasks_with_carry_30d_hint
          from public.users u
          left join task_u t on t.user_id = u.id
          left join budget_u b on b.user_id = u.id
          left join state_u d on d.user_id = u.id
          left join xp_u x on x.user_id = u.id
          left join learn_u l on l.user_id = u.id
          left join beh_u h on h.user_id = u.id
          left join carry_u cr on cr.user_id = u.id
        ),
        ranked as (
          select
            *,
            (
              coalesce(tasks_done_30d, 0) * 3
              + coalesce(budget_rows_30d, 0)
              + coalesce(daily_state_rows_30d, 0) * 2
              + coalesce(xp_events_30d, 0)
              + coalesce(learning_minutes_30d, 0) / 5
              + coalesce(behaviour_completions_30d, 0) * 2
            )::numeric as activity_score
          from scores
        )
        select jsonb_agg(
          jsonb_build_object(
            'email', email,
            'tasks_done_30d', tasks_done_30d,
            'budget_rows_30d', budget_rows_30d,
            'daily_state_rows_30d', daily_state_rows_30d,
            'xp_events_30d', xp_events_30d,
            'xp_sum_30d', xp_sum_30d,
            'learning_minutes_30d', learning_minutes_30d,
            'behaviour_completions_30d', behaviour_completions_30d,
            'open_tasks_with_carry_over', open_tasks_with_carry_30d_hint,
            'activity_score', activity_score
          )
          order by activity_score desc nulls last
        )
        from (select * from ranked order by activity_score desc nulls last limit 100) top_users
      ),
      '[]'::jsonb
    )
  );
end;
$$;

comment on function public.admin_platform_diagnostics() is
  'Returns JSON platform usage stats for admins only (30-day window + per-user snapshot).';

revoke all on function public.admin_platform_diagnostics() from public;
grant execute on function public.admin_platform_diagnostics() to authenticated;
