import type { ReactNode } from "react";
import Link from "next/link";
import type { Json } from "@/types/database.types";

type SectionProps = { title: string; children: ReactNode };

function Section({ title, children }: SectionProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-400/90">{title}</h2>
      <div className="grid gap-2 text-sm sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-black/25 px-3 py-2">
      <span className="text-[11px] text-white/45">{label}</span>
      <span className="font-mono text-base font-medium tabular-nums text-white">{value}</span>
    </div>
  );
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function num(v: unknown, digits = 0): string {
  if (typeof v === "number" && Number.isFinite(v)) {
    return digits > 0 ? v.toLocaleString("nl-NL", { maximumFractionDigits: digits, minimumFractionDigits: digits }) : String(Math.round(v));
  }
  if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) return num(Number(v), digits);
  return "—";
}

function int(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) return String(Math.round(v));
  if (typeof v === "bigint") return v.toString();
  return num(v, 0);
}

type Row = Record<string, unknown>;

export function AdminDiagnosticsView({ payload }: { payload: Json }) {
  const root = asRecord(payload);
  if (!root) {
    return <p className="text-sm text-rose-300">Ongeldige diagnostische data.</p>;
  }

  const users = asRecord(root.users);
  const tasks = asRecord(root.tasks);
  const budget = asRecord(root.budget_entries);
  const daily = asRecord(root.daily_state);
  const learning = asRecord(root.learning_sessions);
  const xp = asRecord(root.xp_events);
  const behaviour = asRecord(root.behaviour_log);
  const missions = asRecord(root.missions);
  const uad = asRecord(root.user_analytics_daily);
  const platformEv = asRecord(root.platform_events);
  const missionOutcomes = asRecord(root.mission_outcome_events);
  const taskEv = asRecord(root.task_events);
  const playTasks = asRecord(root.play_tasks);
  const perUser = Array.isArray(root.per_user) ? (root.per_user as Row[]) : [];

  const since =
    typeof root.since_date === "string"
      ? root.since_date
      : typeof root.since_date === "object" && root.since_date !== null
        ? JSON.stringify(root.since_date)
        : "—";
  const generated =
    typeof root.generated_at === "string" ? root.generated_at : JSON.stringify(root.generated_at ?? "—");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-amber-500/5 px-4 py-3 text-xs text-white/70">
        <p>
          Venster: laatste <strong className="text-white">{int(root.window_days)}</strong> dagen (vanaf kalenderdatum{" "}
          <strong className="font-mono text-white">{since}</strong>).
        </p>
        <p className="mt-1 font-mono text-[10px] text-white/40">Gegenereerd: {generated}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {users ? (
          <Section title="Gebruikers">
            <Stat label="Totaal accounts" value={int(users.total)} />
            <Stat label="Met rol admin" value={int(users.admins)} />
            <Stat label="Met tijdzone ingesteld" value={int(users.with_timezone)} />
            <Stat label="Nieuwe accounts (7 dagen)" value={int(users.signups_last_7d)} />
            <Stat label="Nieuwe accounts in venster (30 d)" value={int(users.signups_last_30d)} />
            <Stat label="Met push-subscription opgeslagen" value={int(users.with_push_subscription)} />
          </Section>
        ) : null}

        {tasks ? (
          <Section title="Taken">
            <Stat label="Actieve taken (niet verwijderd)" value={int(tasks.total_active)} />
            <Stat label="Afgerond (totaal)" value={int(tasks.completed_total)} />
            <Stat label="Openstaand" value={int(tasks.open_total)} />
            <Stat label="Afgerond in venster" value={int(tasks.completed_last_30d)} />
            <Stat label="Aangemaakt in venster" value={int(tasks.created_last_30d)} />
            <Stat label="Open met carry-over (&gt;0)" value={int(tasks.open_with_carry_over)} />
            <Stat label="Gem. carry-over (alle open)" value={num(tasks.avg_carry_over_on_open, 2)} />
            <Stat label="Gem. carry-over (open met carry)" value={num(tasks.avg_carry_over_on_carried_open, 2)} />
            <Stat label="Max carry-over ooit (actief)" value={int(tasks.max_carry_over_seen)} />
            <Stat label="Unieke gebruikers met afronding in venster" value={int(tasks.distinct_users_completed_30d)} />
            <Stat label="Gem. afrondingen per actieve user (venster)" value={num(tasks.avg_completions_per_active_user_30d, 2)} />
          </Section>
        ) : null}

        {budget ? (
          <Section title="Budget (budget_entries)">
            <Stat label="Regels totaal (ooit)" value={int(budget.total_rows)} />
            <Stat label="Regels in venster" value={int(budget.rows_last_30d)} />
            <Stat label="Inkomsten-regels in venster" value={int(budget.income_rows_last_30d)} />
            <Stat label="Uitgaven-regels in venster" value={int(budget.expense_rows_last_30d)} />
            <Stat label="Gebruikers ooit met budgetregel" value={int(budget.distinct_users_ever)} />
            <Stat label="Gebruikers met regel in venster" value={int(budget.distinct_users_last_30d)} />
            <Stat label="Gem. uitgave (cent, venster)" value={num(budget.avg_expense_cents_last_30d, 2)} />
            <Stat label="Gem. inkomen (cent, venster)" value={num(budget.avg_income_cents_last_30d, 2)} />
          </Section>
        ) : null}

        {daily ? (
          <Section title="Dagelijkse state">
            <Stat label="Regels in venster" value={int(daily.rows_last_30d)} />
            <Stat label="Unieke gebruikers" value={int(daily.distinct_users_last_30d)} />
          </Section>
        ) : null}

        {learning ? (
          <Section title="Leren (learning_sessions)">
            <Stat label="Sessies in venster" value={int(learning.rows_last_30d)} />
            <Stat label="Unieke gebruikers" value={int(learning.distinct_users_last_30d)} />
            <Stat label="Totaal minuten in venster" value={int(learning.total_minutes_last_30d)} />
            <Stat label="Gem. minuten per sessie" value={num(learning.avg_minutes_per_session_last_30d, 2)} />
          </Section>
        ) : null}

        {xp ? (
          <Section title="XP (xp_events)">
            <Stat label="Events in venster" value={int(xp.rows_last_30d)} />
            <Stat label="Unieke gebruikers" value={int(xp.distinct_users_last_30d)} />
            <Stat label="Totaal XP in venster" value={int(xp.total_xp_last_30d)} />
            <Stat label="Gem. XP per event" value={num(xp.avg_xp_per_event_last_30d, 2)} />
          </Section>
        ) : null}

        {behaviour ? (
          <Section title="DCIC gedrag (behaviour_log)">
            <Stat label="Missie-afrondingen in venster" value={int(behaviour.completions_last_30d)} />
            <Stat label="Unieke gebruikers" value={int(behaviour.distinct_users_completions_30d)} />
          </Section>
        ) : null}

        {missions ? (
          <Section title="Missies (missions)">
            <Stat label="Afgerond in venster" value={int(missions.completed_last_30d)} />
            <Stat label="Unieke gebruikers" value={int(missions.distinct_users_completed_30d)} />
          </Section>
        ) : null}

        {uad ? (
          <Section title="Dagelijkse analytics (user_analytics_daily)">
            <Stat label="Rijen in venster" value={int(uad.rows_last_30d)} />
            <Stat label="Unieke gebruikers" value={int(uad.distinct_users_last_30d)} />
          </Section>
        ) : null}

        {platformEv ? (
          <Section title="Platform-events">
            <Stat label="Totaal rijen" value={int(platformEv.total)} />
            <Stat label="Actief-vlag aan" value={int(platformEv.active_rows)} />
            <Stat label="Live nu (zichtbaar in app)" value={int(platformEv.live_now)} />
            <Stat label="Aangemaakt in venster" value={int(platformEv.created_last_30d)} />
            <div className="col-span-full pt-1">
              <Link
                href="/admin/events"
                className="text-xs font-medium text-[var(--accent-focus)] hover:underline"
              >
                Events beheren →
              </Link>
            </div>
          </Section>
        ) : null}

        {missionOutcomes ? (
          <Section title="Kwartier / uitkomsten (mission_outcome_events)">
            <Stat label="Events in venster" value={int(missionOutcomes.rows_last_30d)} />
            <Stat label="Unieke gebruikers" value={int(missionOutcomes.distinct_users_last_30d)} />
            <Stat label="Complete" value={int(missionOutcomes.complete_last_30d)} />
            <Stat label="Skip" value={int(missionOutcomes.skip_last_30d)} />
            <Stat label="Verplaatsen" value={int(missionOutcomes.reschedule_last_30d)} />
            <Stat label="Verwijderen" value={int(missionOutcomes.delete_last_30d)} />
          </Section>
        ) : null}

        {taskEv ? (
          <Section title="Taak-events (task_events)">
            <Stat label="Events in venster" value={int(taskEv.rows_last_30d)} />
            <Stat label="Unieke gebruikers" value={int(taskEv.distinct_users_last_30d)} />
            <Stat label="Start" value={int(taskEv.start_last_30d)} />
            <Stat label="Complete" value={int(taskEv.complete_last_30d)} />
            <Stat label="Abandon" value={int(taskEv.abandon_last_30d)} />
          </Section>
        ) : null}

        {playTasks ? (
          <Section title="Play-deck (open taken)">
            <Stat label="Fun" value={int(playTasks.open_fun)} />
            <Stat label="Unwind" value={int(playTasks.open_unwind)} />
            <Stat label="Challenge" value={int(playTasks.open_challenge)} />
          </Section>
        ) : null}
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-400/90">
          Gebruikersactiviteit (top 100, venster)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wide text-white/45">
                <th className="py-2 pr-3 font-medium">E-mail</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Taken ✓</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Budget</th>
                <th className="py-2 pr-3 font-medium tabular-nums">State</th>
                <th className="py-2 pr-3 font-medium tabular-nums">XP evt</th>
                <th className="py-2 pr-3 font-medium tabular-nums">XP Σ</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Leren min</th>
                <th className="py-2 pr-3 font-medium tabular-nums">DCIC ✓</th>
                <th className="py-2 pr-3 font-medium tabular-nums">Open+carry</th>
                <th className="py-2 font-medium tabular-nums">Score</th>
              </tr>
            </thead>
            <tbody>
              {perUser.map((row, i) => (
                <tr key={i} className="border-b border-white/[0.06] hover:bg-white/[0.04]">
                  <td className="max-w-[200px] truncate py-1.5 pr-3 font-mono text-[11px] text-white/85">
                    {String(row.email ?? "—")}
                  </td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums text-white/80">{int(row.tasks_done_30d)}</td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums text-white/80">{int(row.budget_rows_30d)}</td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums text-white/80">{int(row.daily_state_rows_30d)}</td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums text-white/80">{int(row.xp_events_30d)}</td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums text-white/80">{int(row.xp_sum_30d)}</td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums text-white/80">{int(row.learning_minutes_30d)}</td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums text-white/80">{int(row.behaviour_completions_30d)}</td>
                  <td className="py-1.5 pr-3 font-mono tabular-nums text-amber-200/90">{int(row.open_tasks_with_carry_over)}</td>
                  <td className="py-1.5 font-mono tabular-nums text-white/60">{num(row.activity_score, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {perUser.length === 0 ? <p className="mt-3 text-sm text-white/45">Nog geen gebruikers of geen activiteit in dit venster.</p> : null}
        </div>
      </section>
    </div>
  );
}
