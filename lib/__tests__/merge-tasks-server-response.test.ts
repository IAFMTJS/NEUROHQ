import { describe, expect, it } from "vitest";
import { mergeTasksPreferringLocalCompletedWhenServerStale } from "@/lib/merge-tasks-server-response";
import type { Task } from "@/types/database.types";

const base = (over: Partial<Task> & Pick<Task, "id">): Task =>
  ({
    user_id: "u1",
    title: "t",
    due_date: "2026-04-03",
    completed: false,
    completed_at: null,
    carry_over_count: 0,
    energy_required: null,
    priority: 0,
    notes: null,
    created_at: "2026-04-01T00:00:00.000Z",
    updated_at: "2026-04-01T00:00:00.000Z",
    parent_task_id: null,
    deleted_at: null,
    snooze_until: null,
    category: null,
    impact: null,
    domain: null,
    cognitive_load: null,
    emotional_resistance: null,
    mental_load: null,
    social_load: null,
    focus_required: null,
    recurrence_rule: null,
    recurrence_weekdays: null,
    difficulty: null,
    discipline_weight: null,
    strategic_value: null,
    psychology_label: null,
    mission_intent: null,
    mission_chain_id: null,
    validation_type: null,
    base_xp: null,
    avoidance_tag: null,
    hobby_tag: null,
    fatigue_impact: null,
    strategy_key_result_id: null,
    urgency: null,
    task_type: null,
    intensity: null,
    duration_minutes: null,
    task_tags: null,
    ...over,
  }) as Task;

describe("mergeTasksPreferringLocalCompletedWhenServerStale", () => {
  it("keeps existing when server returns empty", () => {
    const a = base({ id: "1" });
    const b = base({ id: "2" });
    expect(mergeTasksPreferringLocalCompletedWhenServerStale([a, b], [])).toEqual([a, b]);
  });

  it("appends local-only rows when server list is a strict subset of local ids", () => {
    const t1 = base({ id: "1", title: "one" });
    const t2 = base({ id: "2", title: "two" });
    const t3 = base({ id: "3", title: "three" });
    const existing = [t1, t2, t3];
    const fromServer = [t1, t2];
    const out = mergeTasksPreferringLocalCompletedWhenServerStale(existing, fromServer);
    expect(out.map((t) => t.id)).toEqual(["1", "2", "3"]);
  });

  it("does not append when server introduces ids not present locally (full replace)", () => {
    const local = [base({ id: "1" })];
    const fromServer = [base({ id: "1" }), base({ id: "2", title: "new" })];
    const out = mergeTasksPreferringLocalCompletedWhenServerStale(local, fromServer);
    expect(out.map((t) => t.id)).toEqual(["1", "2"]);
  });
});
