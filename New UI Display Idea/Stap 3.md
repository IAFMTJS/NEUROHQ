# DARK COMMANDER – STEP 3
Missions System + Reusable Card Variants

All components extend from DESIGN_SYSTEM.md

---

# 1. MISSIONS SCREEN STRUCTURE

Replace Home content with:

<div class="container">

  <header>
    <h1>Missions</h1>
    <p class="text-soft">Active Objectives</p>
  </header>

  <section class="mission-grid">

    <div class="mission-card active">
      <h3>Deep Work Protocol</h3>
      <p class="text-soft">45 min focus cycle</p>
      <div class="progress">
        <div class="progress-fill" style="width:40%"></div>
      </div>
    </div>

    <div class="mission-card locked">
      <h3>Cold Exposure</h3>
      <p class="text-soft">Recovery training</p>
    </div>

    <div class="mission-card completed">
      <h3>Morning Routine</h3>
      <p class="text-soft">Completed</p>
    </div>

  </section>

</div>

---

# 2. GRID SYSTEM

.mission-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

---

# 3. BASE MISSION CARD

.mission-card {
  background: var(--bg-card);
  border-radius: 18px;
  padding: 20px;
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
  transition: 0.2s ease;
}

.mission-card h3 {
  margin-top: 0;
  font-size: 18px;
}

---

# 4. STATE VARIANTS

## 4.1 ACTIVE STATE

.mission-card.active {
  border: 1px solid var(--accent-primary);
  box-shadow: 0 0 20px var(--glow-primary);
}

---

## 4.2 LOCKED STATE

.mission-card.locked {
  opacity: 0.5;
}

---

## 4.3 COMPLETED STATE

.mission-card.completed {
  border: 1px solid var(--accent-cyan);
}

.mission-card.completed::after {
  content: "✓";
  position: absolute;
  top: 12px;
  right: 16px;
  color: var(--accent-cyan);
  font-weight: bold;
}

---

# 5. HOVER INTERACTION

.mission-card:hover {
  transform: translateY(-4px);
}

---

# 6. REUSABILITY RULE

All future content cards must:

- Use 18px radius
- Use var(--bg-card)
- Use var(--border-soft) unless state overrides
- Use 20px padding
- Never introduce new shadow styles

---

# 7. EXTENSION PATTERN

If adding:

Leaderboard  
Growth stats  
Skill tree  

→ Extend from .mission-card  
Do not create new visual logic.

---

END OF STEP 