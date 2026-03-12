# Interaction speed (NEUROHQ)

The biggest UX problem isn’t visuals — it’s **interaction latency**. Native apps feel instant because the UI updates immediately and work happens in the background. This doc is a checklist for making NEUROHQ feel the same.

---

## Symptoms we’re fixing

- Buttons feel delayed (waiting for server before feedback).
- Page transitions slightly lag (blank or spinner instead of structure).
- Lists re-render only after server round-trips.
- UI blocks on server results instead of showing cached/optimistic state first.

---

## 1. Optimistic updates (instant feedback)

**Rule: Update the UI first, then sync to the server.**

- **Already in use:**
  - **Task complete:** `TaskList` updates store + `optimisticCompleteIds` immediately; server runs in background; rollback on error.
  - **Daily state:** `client-pending-writes` writes to localStorage and syncs after 5s idle.
  - **Budget:** `client-pending-budget` for immediate badge/hero updates; server sync after.
  - **Delete/snooze/skip:** `removeTask(id, date)` before server so list updates instantly.

- **Apply everywhere:**
  - Add task → show new row (or placeholder) immediately with “Saving…” style; replace with server data when done.
  - Edit task → apply title/fields in UI and in store; persist in background.
  - Toggles (e.g. settings) → flip UI state immediately; call server action in background; revert + toast on failure.

---

## 2. Don’t block the whole UI on one action

**Rule: Only the affected control shows “in progress”; everything else stays interactive.**

- **Problem:** A single `useTransition` + `disabled={pending}` disables *all* buttons (e.g. every complete checkbox) while any one action is pending.
- **Fix:**
  - Use **per-item pending state** (e.g. `pendingCompleteIds`, `pendingDeleteId`) so only the clicked button shows loading.
  - Keep buttons enabled unless that specific row is in flight (and optionally prevent double-submit with a local flag for that id only).

---

## 3. Page transitions (no blank screen)

**Rule: Show structure immediately; load data into it.**

- **Already in use:**
  - `app/(dashboard)/dashboard/loading.tsx` → `DashboardShellSkeleton` during route change.
  - `useDelayedLoading` / `DelayedFallback` (250 ms) so spinners only appear when the wait is noticeable.

- **Apply everywhere:**
  - Add `loading.tsx` for every heavy route (e.g. `tasks`, `budget`, `strategy`) so navigation shows a skeleton instead of a blank main.
  - Prefer **streaming + Suspense**: render shell and critical content first; wrap secondary blocks in `<Suspense fallback={…}>` with a short-delay fallback.

---

## 4. Lists: render from client state first

**Rule: Lists should reflect store/cache immediately; server confirms in background.**

- **Already in use:**
  - Tasks: `useHQStore` + `tasksByDate` + `localTasksAdded` + `optimisticCompleteIds` so the list isn’t waiting on `router.refresh()` for the visible change.
  - Bootstrap: `useTasksBootstrap` fills store from API only when cache is empty; first paint can use persisted data.

- **Avoid:**
  - Calling `router.refresh()` as the *only* way to show an update when you’ve already updated the client store (e.g. after complete/delete). Use refresh only when you need server-derived data (e.g. new `completedToday` count) and consider merging that into the store instead of full re-render.

---

## 5. Buttons and forms

**Rule: Visual feedback in &lt; 100 ms; never “dead” clicks.**

- **Instant feedback:**
  - On click: immediate visual change (e.g. checkbox checked, item moved to “completed” section) from optimistic update.
  - Optional: subtle loading indicator on the *single* button (e.g. small spinner or “Saving…”) without disabling other actions.

- **Avoid:**
  - `disabled={pending}` on every submit/complete button when `pending` is global.
  - Replacing entire button label with “Saving…” for long periods without any optimistic UI change.

---

## 6. Server actions: fire-and-forget where possible

**Rule: Don’t await the server to update what the user already sees.**

- Trigger the server action (e.g. `completeTask`, `saveDailyState`) **after** updating the UI/store.
- Use `startTransition` to keep the UI responsive; inside it, await only for toasts, level-up modals, or error rollback — not for the first paint of the new state.

---

## 7. Checklist when adding or changing a feature

- [ ] **Optimistic:** Does the UI change immediately (store/local state) before the server responds?
- [ ] **Scoped pending:** Is only the affected control disabled or showing “in progress”, not the whole screen?
- [ ] **Route transition:** Does this route have a `loading.tsx` (or Suspense fallback) so navigation isn’t blank?
- [ ] **Lists:** Do list updates come from client state first, with server sync in background?
- [ ] **Buttons:** Does the user see feedback in &lt; 100 ms (optimistic) and never a “dead” click?

---

## References in codebase

| Pattern              | Location |
|----------------------|----------|
| Optimistic complete  | `components/TaskList.tsx` — `handleComplete`, `optimisticCompleteIds`, `upsertTask` |
| Pending daily state  | `lib/client-pending-writes.ts` |
| Pending budget       | `lib/client-pending-budget.ts` |
| Delayed loading      | `app/hooks/useDelayedLoading.ts`, `components/ui/DelayedFallback.tsx` |
| Dashboard loading    | `app/(dashboard)/dashboard/loading.tsx` |
| Tasks store          | `lib/hq-store.ts` (TasksSlice), `lib/tasks-bootstrap.ts` |
