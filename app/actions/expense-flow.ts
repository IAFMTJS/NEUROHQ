"use server";

/**
 * Single app entry for “user logged a budget line” (expense or income).
 * Wraps validation, insert, lock/survey side-effects, and revalidation.
 */

import { addBudgetEntry } from "@/app/actions/budget";

export type LogExpenseParams = Parameters<typeof addBudgetEntry>[0];

/** Log a budget entry (negative amount_cents = expense). Prefer this over calling `addBudgetEntry` directly in new UI code. */
export async function logExpense(params: LogExpenseParams): Promise<{ id: string } | null> {
  return addBudgetEntry(params);
}
