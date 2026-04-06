import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  completeTask,
  createTask,
  deleteTask,
  duplicateTask,
  rescheduleTask,
  skipNextOccurrence,
  snoozeTask,
  uncompleteTask,
  updateTask,
} from "@/app/actions/tasks";
import { addBudgetEntry, updateBudgetSettings } from "@/app/actions/budget";
import { IDEMPOTENCY_HEADER, type OutboxActionType } from "@/lib/mobile/supabase-first-contract";

type PushBody = {
  action?: OutboxActionType;
  payload?: Record<string, unknown>;
  mutationId?: string;
};

function clientErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Failed";
}

function isConflictMessage(message: string): boolean {
  return /not found|invalid|already|task not found/i.test(message);
}

function parseTaskUpdateParams(raw: unknown): Parameters<typeof updateTask>[1] | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const out: Parameters<typeof updateTask>[1] = {};
  if (typeof p.title === "string") out.title = p.title;
  if (typeof p.due_date === "string") out.due_date = p.due_date;
  if (p.category === "work" || p.category === "personal" || p.category === null) out.category = p.category;
  if (p.recurrence_rule === "daily" || p.recurrence_rule === "weekly" || p.recurrence_rule === "monthly" || p.recurrence_rule === null) {
    out.recurrence_rule = p.recurrence_rule;
  }
  if (typeof p.recurrence_weekdays === "string" || p.recurrence_weekdays === null) {
    out.recurrence_weekdays = p.recurrence_weekdays as string | null;
  }
  for (const key of ["impact", "urgency", "energy_required", "focus_required", "mental_load", "social_load", "priority"] as const) {
    const v = p[key];
    if (typeof v === "number" || v === null) out[key] = v as never;
  }
  if (typeof p.notes === "string" || p.notes === null) out.notes = p.notes;
  return Object.keys(out).length > 0 ? out : null;
}

function parseBudgetSettingsPayload(raw: unknown): Parameters<typeof updateBudgetSettings>[0] | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const out: Parameters<typeof updateBudgetSettings>[0] = {};
  if (typeof p.monthly_budget_cents === "number" || p.monthly_budget_cents === null) {
    out.monthly_budget_cents = p.monthly_budget_cents as number | null;
  }
  if (typeof p.monthly_savings_cents === "number" || p.monthly_savings_cents === null) {
    out.monthly_savings_cents = p.monthly_savings_cents as number | null;
  }
  if (typeof p.currency === "string" || p.currency === null) out.currency = p.currency;
  if (typeof p.impulse_threshold_pct === "number" || p.impulse_threshold_pct === null) {
    out.impulse_threshold_pct = p.impulse_threshold_pct as number | null;
  }
  if (p.budget_period === "monthly" || p.budget_period === "weekly" || p.budget_period === null) {
    out.budget_period = p.budget_period;
  }
  if (typeof p.impulse_quick_add_minutes === "number" || p.impulse_quick_add_minutes === null) {
    out.impulse_quick_add_minutes = p.impulse_quick_add_minutes as number | null;
  }
  if (Array.isArray(p.impulse_risk_categories)) {
    out.impulse_risk_categories = p.impulse_risk_categories.filter((x): x is string => typeof x === "string");
  }
  if (typeof p.payday_day_of_month === "number" || p.payday_day_of_month === null) {
    out.payday_day_of_month = p.payday_day_of_month as number | null;
  }
  if (typeof p.last_payday_date === "string" || p.last_payday_date === null) {
    out.last_payday_date = p.last_payday_date;
  }
  if (p.apply_to_next_period === true) out.apply_to_next_period = true;
  return Object.keys(out).length > 0 ? out : null;
}

async function readIdempotentReplay(
  userId: string,
  idempotencyKey: string
): Promise<Record<string, unknown> | null> {
  const supabase = await createClient();
  const db = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{ data: unknown }>;
          };
        };
      };
    };
  };
  const { data } = await db
    .from("mobile_sync_receipts")
    .select("response_json")
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  const row = data as { response_json?: unknown } | null;
  if (!row || typeof row.response_json !== "object" || row.response_json == null) return null;
  return row.response_json as Record<string, unknown>;
}

async function saveIdempotentReplay(
  userId: string,
  idempotencyKey: string,
  action: string,
  responseJson: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const db = supabase as unknown as {
    from: (table: string) => {
      insert: (row: Record<string, unknown>) => Promise<unknown>;
    };
  };
  try {
    await db.from("mobile_sync_receipts").insert({
      user_id: userId,
      idempotency_key: idempotencyKey,
      action,
      response_json: responseJson,
    });
    return responseJson;
  } catch {
    const replay = await readIdempotentReplay(userId, idempotencyKey);
    return replay ?? responseJson;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (!idempotencyKey) {
    return NextResponse.json({ error: `Missing ${IDEMPOTENCY_HEADER}` }, { status: 400 });
  }

  const replay = await readIdempotentReplay(user.id, idempotencyKey);
  if (replay) {
    return NextResponse.json({ ...replay, replayed: true });
  }

  let body: PushBody;
  try {
    body = (await request.json()) as PushBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action;
  const payload = body.payload ?? {};

  const okResponse = (act: string, extra: Record<string, unknown> = {}) =>
    saveIdempotentReplay(user.id, idempotencyKey, act, {
      ok: true,
      action: act,
      mutationId: body.mutationId ?? null,
      ...extra,
    }).then((json) => NextResponse.json(json));

  if (action === "task.create") {
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const dueDate = typeof payload.due_date === "string" ? payload.due_date : "";
    if (title.length === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json({ error: "Invalid task.create payload" }, { status: 400 });
    }
    const result = await createTask({
      title,
      due_date: dueDate,
      energy_required: typeof payload.energy_required === "number" ? payload.energy_required : null,
      priority: typeof payload.priority === "number" ? payload.priority : null,
    });
    const responseJson = {
      ok: Boolean(result?.ok),
      action,
      mutationId: body.mutationId ?? null,
      taskId: result?.id ?? null,
    };
    const replayJson = await saveIdempotentReplay(user.id, idempotencyKey, action, responseJson);
    return NextResponse.json(replayJson);
  }

  if (action === "task.complete") {
    const taskId = typeof payload.taskId === "string" ? payload.taskId : "";
    if (!taskId) return NextResponse.json({ error: "Invalid task.complete payload" }, { status: 400 });
    try {
      await completeTask(taskId, { startedAt: typeof payload.completedAt === "string" ? payload.completedAt : null });
    } catch (err) {
      const message = clientErrorMessage(err);
      if (isConflictMessage(message)) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }
    return okResponse("task.complete", { taskId });
  }

  if (action === "task.uncomplete") {
    const taskId = typeof payload.taskId === "string" ? payload.taskId : "";
    if (!taskId) return NextResponse.json({ error: "Invalid task.uncomplete payload" }, { status: 400 });
    try {
      await uncompleteTask(taskId);
    } catch (err) {
      const message = clientErrorMessage(err);
      if (isConflictMessage(message)) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }
    return okResponse("task.uncomplete", { taskId });
  }

  if (action === "task.delete") {
    const taskId = typeof payload.taskId === "string" ? payload.taskId : "";
    if (!taskId) return NextResponse.json({ error: "Invalid task.delete payload" }, { status: 400 });
    try {
      await deleteTask(taskId);
    } catch (err) {
      const message = clientErrorMessage(err);
      if (isConflictMessage(message)) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }
    return okResponse("task.delete", { taskId });
  }

  if (action === "task.snooze") {
    const taskId = typeof payload.taskId === "string" ? payload.taskId : "";
    if (!taskId) return NextResponse.json({ error: "Invalid task.snooze payload" }, { status: 400 });
    try {
      await snoozeTask(taskId);
    } catch (err) {
      const message = clientErrorMessage(err);
      if (isConflictMessage(message)) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }
    return okResponse("task.snooze", { taskId });
  }

  if (action === "task.skip_next") {
    const taskId = typeof payload.taskId === "string" ? payload.taskId : "";
    if (!taskId) return NextResponse.json({ error: "Invalid task.skip_next payload" }, { status: 400 });
    try {
      await skipNextOccurrence(taskId);
    } catch (err) {
      const message = clientErrorMessage(err);
      if (isConflictMessage(message)) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }
    return okResponse("task.skip_next", { taskId });
  }

  if (action === "task.reschedule") {
    const taskId = typeof payload.taskId === "string" ? payload.taskId : "";
    const dueDate = typeof payload.due_date === "string" ? payload.due_date : "";
    if (!taskId || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json({ error: "Invalid task.reschedule payload" }, { status: 400 });
    }
    try {
      await rescheduleTask(taskId, dueDate);
    } catch (err) {
      const message = clientErrorMessage(err);
      if (isConflictMessage(message)) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }
    return okResponse("task.reschedule", { taskId, due_date: dueDate });
  }

  if (action === "task.duplicate") {
    const taskId = typeof payload.taskId === "string" ? payload.taskId : "";
    const dueDate = typeof payload.due_date === "string" ? payload.due_date : "";
    if (!taskId || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json({ error: "Invalid task.duplicate payload" }, { status: 400 });
    }
    try {
      await duplicateTask(taskId, dueDate);
    } catch (err) {
      const message = clientErrorMessage(err);
      if (isConflictMessage(message)) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }
    return okResponse("task.duplicate", { taskId, due_date: dueDate });
  }

  if (action === "task.update") {
    const taskId = typeof payload.taskId === "string" ? payload.taskId : "";
    const params = parseTaskUpdateParams(payload.params);
    if (!taskId || !params) {
      return NextResponse.json({ error: "Invalid task.update payload" }, { status: 400 });
    }
    try {
      await updateTask(taskId, params);
    } catch (err) {
      const message = clientErrorMessage(err);
      if (isConflictMessage(message)) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }
    return okResponse("task.update", { taskId });
  }

  if (action === "budget.add_entry") {
    const amount = typeof payload.amount_cents === "number" ? payload.amount_cents : NaN;
    const date = typeof payload.date === "string" ? payload.date : "";
    if (!Number.isFinite(amount) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid budget.add_entry payload" }, { status: 400 });
    }
    try {
      const result = await addBudgetEntry({
        amount_cents: amount,
        date,
        category: typeof payload.category === "string" ? payload.category : undefined,
        note: typeof payload.note === "string" ? payload.note : undefined,
        is_planned: typeof payload.is_planned === "boolean" ? payload.is_planned : undefined,
        store_name: typeof payload.store_name === "string" ? payload.store_name : null,
        subscription_name: typeof payload.subscription_name === "string" ? payload.subscription_name : null,
        detail_name: typeof payload.detail_name === "string" ? payload.detail_name : null,
        emergency_override_reason:
          typeof payload.emergency_override_reason === "string" ? payload.emergency_override_reason : null,
      });
      const responseJson = {
        ok: true,
        action,
        mutationId: body.mutationId ?? null,
        budgetEntryId: result?.id ?? null,
      };
      const replayJson = await saveIdempotentReplay(user.id, idempotencyKey, action, responseJson);
      return NextResponse.json(replayJson);
    } catch (err) {
      const message = clientErrorMessage(err);
      if (isConflictMessage(message) || /budget lock|survey|nooduitgaven|Vul eerst/i.test(message)) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }
  }

  if (action === "budget.update_settings") {
    const settings = parseBudgetSettingsPayload(payload.settings ?? payload);
    if (!settings) {
      return NextResponse.json({ error: "Invalid budget.update_settings payload" }, { status: 400 });
    }
    try {
      await updateBudgetSettings(settings);
    } catch (err) {
      const message = clientErrorMessage(err);
      if (isConflictMessage(message) || /geen budget/i.test(message)) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }
    return okResponse("budget.update_settings", {});
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
