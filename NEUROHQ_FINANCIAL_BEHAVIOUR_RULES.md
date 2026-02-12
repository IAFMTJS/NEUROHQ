# NEUROHQ — Financial Behaviour Rules

**Purpose:** Define impulse spending detection and 24h freeze behaviour so implementation is consistent.

---

## 1. Impulse spending detection

**Goal:** Flag spending that may be impulsive so the user can pause or reflect.

### 1.1 Definitions

- **Planned expense:** `budget_entries.is_planned = true` and optionally linked to a savings goal or category the user marked as planned.
- **Unplanned expense:** `is_planned = false` and `amount_cents < 0`.

### 1.2 Impulse signals (any can trigger; configurable per user later)

1. **Size vs weekly budget**  
   - Compute user’s “typical” weekly spend (e.g. rolling 4-week average of expenses).  
   - If a single unplanned expense &gt; **X%** of that average (e.g. 30–50%), flag as *possible impulse*.  
   - Default: **40%** of 4-week average.

2. **Speed of entry**  
   - If user adds an expense &lt; **Y minutes** after opening the app or the “Add expense” flow, optionally flag (e.g. “Quick add – still sure?”).  
   - Default: **2 minutes** (optional; can be feature-flagged off).

3. **Category**  
   - Optional: categories the user marks as “high impulse risk” (e.g. “Shopping”, “Eating out”) get flagged when unplanned.  
   - Stored as user preference (e.g. `users.impulse_categories` or a small config table).

### 1.3 Actions when impulse is detected

- **In-app:** Show a gentle notice: “This looks like an unplanned expense. Add to 24h freeze to decide tomorrow?” with [Add to freeze] [It’s planned] [Skip].  
- **Push:** If savings alert push is enabled and impulse is above threshold, count toward “max 3 per day” and send once per day max for impulse.  
- **Reality report:** Include “Unplanned expenses this week: N” and total amount.

### 1.4 Configuration (future)

- Sliders or toggles: % threshold, enable/disable “speed of entry” check, which categories are high-risk.  
- Stored in `users` or a `user_settings` table.

---

## 2. 24h freeze

**Goal:** Let the user “freeze” a planned purchase for 24 hours and get a reminder to confirm or cancel.

### 2.1 What can be frozen

- A **planned purchase** represented as:
  - A `budget_entries` row with `is_planned = true` and negative `amount_cents` (or zero with note “I plan to spend X”), or  
  - A dedicated “planned purchase” entity (e.g. `planned_purchases` table: user_id, amount_cents, description, created_at, freeze_until, status: pending | frozen | confirmed | cancelled).  

**Recommended:** Use `budget_entries` with `is_planned = true` and add optional columns:  
- `freeze_until timestamptz`  
- `freeze_reminder_sent boolean default false`  

When user clicks “Freeze”, set `freeze_until = now() + 24 hours` and optionally create an `alternatives` row (type = 'purchase_freeze', reference_id = budget_entries.id) with suggestion_text = “You froze this. Confirm or cancel after 24h.”

### 2.2 Flow

1. User adds a planned expense (or “planned purchase” item) and chooses **“Freeze 24h”**.  
2. System sets `freeze_until = now() + 24h` (in user timezone).  
3. Item is shown in a “Frozen” list; user cannot confirm/cancel until 24h passed (or we allow “Cancel freeze” early).  
4. After 24h:  
   - **Cron or scheduled job** finds rows where `freeze_until <= now()` and `freeze_reminder_sent = false`.  
   - Send push (or in-app only): “Your frozen purchase ‘X’ is ready. Confirm or cancel?”  
   - Set `freeze_reminder_sent = true`.  
5. User chooses **Confirm** → treat as normal planned expense (e.g. mark as “confirmed” or leave as-is and log).  
6. User chooses **Cancel** → set `amount_cents = 0` and mark cancelled, or soft-delete, and optionally add to `alternatives` as “You cancelled: [description]”.

### 2.3 Limits

- Max **5** active freezes per user at once (optional; avoid abuse).  
- Freeze only for planned items (not past expenses).

---

## 3. Alternative suggestions

- When user freezes or cancels, we can suggest **alternatives** (e.g. “Save the amount to [savings goal] instead” or “Cheaper option: …”).  
- Stored in `alternatives` table: type, reference_id, suggestion_text.  
- Shown in UI when viewing the frozen item or in the weekly reality report (“You cancelled X – consider Y”).

---

## 4. Summary table

| Rule            | Default / value        | Configurable later |
|----------------|------------------------|--------------------|
| Impulse: % of weekly | 40% of 4-week avg   | Yes                |
| Impulse: quick-add window | 2 min              | Yes (or off)       |
| Impulse: categories | None (all unplanned) | Yes (list)         |
| Freeze duration | 24h                   | Yes                |
| Max active freezes | 5                   | Yes                |

---

END OF FINANCIAL BEHAVIOUR RULES
