"use server";

import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/utils/timezone";
import { getMonthlyBookForCurrentMonth } from "@/app/actions/learning";

type EnsureReadingMissionResult = { created: boolean; debug?: string };

export async function ensureReadingMissionForToday(): Promise<EnsureReadingMissionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { created: false, debug: "no_user" };

  const today = todayDateString();
  const book = await getMonthlyBookForCurrentMonth();
  if (!book || !book.total_pages || book.total_pages <= 0) {
    return { created: false, debug: "no_book" };
  }

  const totalPages = book.total_pages ?? 0;
  const pagesRead = book.pages_read ?? 0;
  const remaining = Math.max(0, totalPages - pagesRead);
  if (remaining === 0) return { created: false, debug: "already_done" };

  const now = new Date(today + "T12:00:00Z");
  const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 12));
  const diffMs = endOfMonth.getTime() - now.getTime();
  const daysLeft = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
  const pagesToday = Math.max(5, Math.ceil(remaining / daysLeft));

  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("due_date", today)
    .eq("psychology_label", "MonthlyBookAuto")
    .is("deleted_at", null)
    .limit(1);
  if (existing && existing.length > 0) {
    return { created: false, debug: "already_exists" };
  }

  const title = `Lees ${pagesToday} pagina's in je boek`;

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    due_date: today,
    energy_required: 2,
    category: "personal",
    impact: 2,
    domain: "learning",
    base_xp: 40,
    psychology_label: "MonthlyBookAuto",
    notes: "Maandelijkse boekdoel · auto-missie op basis van resterende pagina's.",
    mission_intent: "discipline",
  });
  if (error) {
    return { created: false, debug: error.message };
  }

  return { created: true };
}

