import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/tasks/reschedule — move a task to another date.
 * Used by client components (e.g. YesterdayTasksModal) to avoid server-action HMR issues.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const taskId = typeof body.taskId === "string" ? body.taskId : null;
  const dueDate = typeof body.dueDate === "string" ? body.dueDate : null;

  if (!taskId || !dueDate) {
    return NextResponse.json({ error: "taskId and dueDate required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { error } = await supabase
    .from("tasks")
    .update({ due_date: dueDate })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
