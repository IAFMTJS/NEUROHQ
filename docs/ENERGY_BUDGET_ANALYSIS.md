# Energy Budget: Full Analysis from Brain Status

This document explains exactly how brain status (daily check-in) translates into **suggested task count** and **pool capacities** (Energy, Focus, Load), and how tasks consume those pools.

---

## What does “Load” (the load pool) really mean?

**Load** is **headroom before overload** — how much more cognitive, sensory, or social demand you can take on today before the model assumes you’re over capacity.

- **Not** “how much load you have” (that’s your check-in: sensory load + social load).  
- **Yes** “how much extra load you can still absorb” from tasks and calendar.

What consumes it:

- **Tasks**: every task costs a bit of load (15% of its total cost). Harder tasks cost more.
- **Calendar**: events consume load; **social** events cost more load (50% of their cost) than non-social (20%).

So when **load remaining** is low, it means: you’re close to the model’s idea of “full” for the day. Adding more demanding or social things is more likely to tip you over. The **load capacity** you’re “given” is just that headroom number (with a minimum of 25 so calendar/social always have some room).

---

## 1. Brain Status Inputs

| Input | Scale | Default if empty | Meaning |
|-------|--------|-------------------|---------|
| **Energy** | 1–10 | 5 | How charged / mentally energetic you feel |
| **Focus** | 1–10 | 5 | How sharp and able to sustain attention |
| **Sensory load** | 1–10 | 5 | How much sensory/cognitive load you're under |
| **Social load** | 1–10 | 5 | How much social demand or interaction load |
| **Sleep (hours)** | 0–24 | 7 | Hours slept; used as a multiplier on capacity |

All 1–10 values are **higher = more** of that thing (e.g. high load = more stress, not “more capacity”).

---

## 2. How Suggested Task Count Is Computed

Formula (from `lib/utils/energy.ts` → `getSuggestedTaskCount`):

```
baseScore     = (energy + focus) / 2                    // 1–10
loadPenalty   = (sensory_load/10)*1.5 + (social_load/10)*1.0   // 0–2.5
sleepMod      = lookup(sleep_hours)                      // see table below
raw           = max(1, (baseScore - loadPenalty) * sleepMod * 0.5 + 2.5)
suggestedTaskCount = clamp(round(raw), 1, 8)
```

### Sleep multiplier (sleepMod)

| Sleep (hours) | sleepMod | Effect |
|---------------|----------|--------|
| ≥ 8 | 1.15 | +15% capacity |
| 7–8 | 1.05 | +5% capacity |
| 6–7 | 1.0 | neutral |
| 5–6 | 0.9 | −10% capacity |
| < 5 | 0.75 | −25% capacity |
| null (not set) | 1.0 | neutral |

### Load penalty (how much capacity is reduced)

- **Sensory load**: each point (1–10) adds `0.15` to the penalty. Max contribution = 1.5.
- **Social load**: each point (1–10) adds `0.1` to the penalty. Max contribution = 1.0.
- Combined **loadPenalty** range: **0 to 2.5**.

### Worked examples (suggested task count)

| Energy | Focus | Sensory load | Social load | Sleep | baseScore | loadPenalty | sleepMod | raw | **Suggested tasks** |
|--------|-------|--------------|-------------|-------|-----------|-------------|----------|-----|----------------------|
| 5 | 5 | 5 | 5 | 7 | 5 | 1.6 | 1.1 | 3.74 | **4** |
| 8 | 8 | 3 | 3 | 8 | 8 | 0.96 | 1.2 | 5.82 | **6** |
| 3 | 4 | 7 | 6 | 5.5 | 3.5 | 2.12 | 0.85 | 2.0 | **2** |
| 7 | 6 | 2 | 2 | 7 | 6.5 | 0.64 | 1.1 | 4.5 | **5** |
| 5 | 5 | 10 | 10 | 7 | 5 | 3.2 | 1.1 | 2.0 | **2** |
| 10 | 10 | 1 | 1 | 8 | 10 | 0.32 | 1.2 | 7.2 | **7** |

So: **higher energy + focus, lower load, better sleep → more suggested tasks** (up to 8).

---

## 3. How Much Energy (Capacity) Gets Given — The Three Pools

Capacities are **not** raw 0–100 scales. They are in “cost units” so that **suggestedTaskCount** tasks of average difficulty fit with 2× headroom (3–5 tasks shouldn't empty the budget).

### Per-pool capacity formula

```
energyCapacity = round(suggestedTaskCount × AVG_TASK_ENERGY × CAPACITY_BUFFER)
focusCapacity  = round(suggestedTaskCount × AVG_TASK_FOCUS  × CAPACITY_BUFFER)
loadCapacity   = max(round(suggestedTaskCount × AVG_TASK_LOAD × CAPACITY_BUFFER), 25)
```

Constants:

| Constant | Value | Meaning |
|----------|--------|---------|
| AVG_TASK_ENERGY | 6 | Energy cost of one “average” task (energy_required = 5) |
| AVG_TASK_FOCUS | 4 | Focus cost of one average task |
| AVG_TASK_LOAD | 2 | Load cost of one average task |
| CAPACITY_BUFFER | 2.0 | 2× headroom so you’re not exactly at limit |

So for a given **suggested task count N**:

| Pool | Formula | Example (N=4) |
|------|---------|----------------|
| Energy | N × 6 × 2.0 | 48 |
| Focus | N × 4 × 2.0 | 32 |
| Load | max(N × 2 × 2.0, 25) | max(16, 25) = **25** |

**Summary: on the basis of brain status, “how much energy gets given” is exactly these three numbers (energy, focus, load capacity), all derived from the single number `suggestedTaskCount`, which is computed from energy, focus, sensory_load, social_load, and sleep.**

---

## 4. Capacity by Suggested Task Count (reference)

| Suggested tasks | Energy capacity | Focus capacity | Load capacity (min 25) |
|-----------------|-----------------|----------------|-------------------------|
| 1 | 12 | 8 | 25 |
| 2 | 24 | 16 | 25 |
| 3 | 36 | 24 | 25 |
| 4 | 48 | 32 | 25 |
| 5 | 60 | 40 | 25 |
| 6 | 72 | 48 | 25 |
| 7 | 84 | 56 | 28 |
| 8 | 96 | 64 | 32 |

---

## 5. How Tasks Consume the Pools (task cost)

Each task has **energy_required** 1–10 (default 5). Total cost = `energy_required × 2.5` (TASK_COST_MULTIPLIER = 2.5), split across pools:

| Pool | Share | Formula | Example (energy_required = 5) |
|------|--------|---------|-------------------------------|
| Energy | 50% | round(raw × 0.5) | 6 |
| Focus | 35% | round(raw × 0.35) | 4 |
| Load | 15% | round(raw × 0.15) | 2 |

**Cost per task by energy_required (1–10):**

| energy_required | Raw (×2.5) | Energy | Focus | Load |
|-----------------|------------|--------|-------|------|
| 1 | 2.5 | 1 | 1 | 0 |
| 2 | 5 | 3 | 2 | 1 |
| 3 | 7.5 | 4 | 3 | 1 |
| 4 | 10 | 5 | 4 | 2 |
| 5 | 12.5 | 6 | 4 | 2 |
| 6 | 15 | 8 | 5 | 2 |
| 7 | 17.5 | 9 | 6 | 3 |
| 8 | 20 | 10 | 7 | 3 |
| 9 | 22.5 | 11 | 8 | 3 |
| 10 | 25 | 13 | 9 | 4 |

So: **on the basis of brain status, you get a fixed set of pool capacities (from step 3). Each task then deducts from those pools according to its energy_required (this table).**

---

## 6. End-to-end: Brain status → energy given

1. **Brain status** (energy, focus, sensory_load, social_load, sleep_hours)  
   → **suggestedTaskCount** (1–8).

2. **suggestedTaskCount**  
   → **Energy / Focus / Load capacities** (with 35% buffer and load floor 25).

3. **Tasks (and calendar)**  
   → deduct from the three pools using the task cost split above.

4. **Remaining** in each pool = capacity − used − planned.  
   The **overall** “remaining” shown in the app is the **minimum** of the three remaining values (the bottleneck pool).

So: **“On the basis of brain status, how much energy gets given”** = the three pool capacities (energy, focus, load) from section 3, which are fully determined by the suggested task count, which is fully determined by the five brain status inputs and the formulas in section 2.

---

## 7. Full stats reference (all three pools)

For each pool you have four numbers. **Capacity** = what brain status gave you. **Used** = completed tasks + calendar. **Planned** = incomplete tasks. **Remaining** = capacity − used − planned.

| Pool   | What it represents        | Capacity formula                    | Consumed by                          |
|--------|---------------------------|-------------------------------------|--------------------------------------|
| Energy | Mental/physical fuel     | N × 6 × 2.0                         | Tasks (50%), calendar (40% or 30%)   |
| Focus  | Sustained attention      | N × 4 × 2.0                         | Tasks (35%), calendar (40% or 20%)  |
| Load   | Headroom before overload | max(N × 2 × 2.0, 25)                | Tasks (15%), calendar (20% or 50%)   |

**Full stats table (example: 4 suggested tasks, 3 small tasks done [energy_required=3 each], no calendar):**

| Pool   | Capacity | Used | Planned | Remaining |
|--------|----------|------|---------|-----------|
| Energy | 48       | 12   | 0       | 36        |
| Focus  | 32       | 9    | 0       | 23        |
| Load   | 25       | 3    | 0       | 22        |

*Headroom (bottleneck) = min(36, 23, 22) = **22** — budget stays non-empty after 3 small tasks.*
