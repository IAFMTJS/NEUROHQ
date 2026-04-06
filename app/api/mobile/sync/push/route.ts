import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTask, completeTask } from "@/app/actions/tasks";
import { addBudgetEntry } from "@/app/actions/budget";
import { IDEMPOTENCY_HEADER } from "@/lib/mobile/supabase-first-contract";

type PushBody = {
  action?: "task.create" | "task.complete" | "budget.add_entry";
  payload?: Record<string, unknown>;
  mutationId?: string;
};

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
      const message = err instanceof Error ? err.message : "Failed";
      if (/not found|invalid|already/i.test(message)) {
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }
    const responseJson = {
      ok: true,
      action,
      mutationId: body.mutationId ?? null,
      taskId,
    };
    const replayJson = await saveIdempotentReplay(user.id, idempotencyKey, action, responseJson);
    return NextResponse.json(replayJson);
  }

  if (action === "budget.add_entry") {
    const amount = typeof payload.amount_cents === "number" ? payload.amount_cents : NaN;
    const date = typeof payload.date === "string" ? payload.date : "";
    if (!Number.isFinite(amount) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid budget.add_entry payload" }, { status: 400 });
    }
    const result = await addBudgetEntry({
      amount_cents: amount,
      date,
      category: typeof payload.category === "string" ? payload.category : undefined,
      note: typeof payload.note === "string" ? payload.note : undefined,
    });
    const responseJson = {
      ok: true,
      action,
      mutationId: body.mutationId ?? null,
      budgetEntryId: result?.id ?? null,
    };
    const replayJson = await saveIdempotentReplay(user.id, idempotencyKey, action, responseJson);
    return NextResponse.json(replayJson);
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

