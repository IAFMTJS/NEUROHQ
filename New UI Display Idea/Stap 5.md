# DARK COMMANDER – STEP 5
Growth / Skill Tree System

All components extend from existing tokens.
No new design logic allowed.

---

# 1. GROWTH SCREEN STRUCTURE

<div class="container page">

  <header>
    <h1>Growth</h1>
    <p class="text-soft">Upgrade your system</p>
  </header>

  <section class="skill-tree">

    <div class="skill-node unlocked">
      <div class="node-inner">Focus I</div>
    </div>

    <div class="skill-connector"></div>

    <div class="skill-node locked">
      <div class="node-inner">Focus II</div>
    </div>

    <div class="skill-connector"></div>

    <div class="skill-node locked">
      <div class="node-inner">Deep Focus</div>
    </div>

  </section>

</div>

---

# 2. SKILL TREE LAYOUT

.skill-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  margin-top: 24px;
}

---

# 3. BASE SKILL NODE

.skill-node {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-card);
  transition: 0.2s ease;
}

.node-inner {
  font-size: 13px;
  text-align: center;
}

---

# 4. STATE VARIANTS

## 4.1 UNLOCKED

.skill-node.unlocked {
  border: 1px solid var(--accent-primary);
  box-shadow: 0 0 20px var(--glow-primary);
}

## 4.2 LOCKED

.skill-node.locked {
  opacity: 0.4;
}

## 4.3 HOVER

.skill-node.unlocked:hover {
  transform: scale(1.05);
}

---

# 5. CONNECTOR

.skill-connector {
  width: 2px;
  height: 40px;
  background: var(--border-soft);
}

When previous node is unlocked:

.skill-node.unlocked + .skill-connector {
  background: var(--accent-primary);
}

---

# 6. EXP BAR (TOP LEVEL PROGRESSION)

Add above skill tree:

<section class="card">
  <h3>Level 4</h3>
  <div class="progress">
    <div class="progress-fill" style="width:72%"></div>
  </div>
  <p class="text-soft">720 / 1000 XP</p>
</section>

---

# 7. EXPANSION RULE

Future skill trees must:

- Use circular nodes only
- Use 120px size
- Use token borders
- Use accent-primary for unlock glow
- Never introduce new color systems

---

# 8. MOTION RULE

Unlocking animation:

@keyframes unlockPulse {
  0% { box-shadow: 0 0 0px var(--glow-primary); }
  50% { box-shadow: 0 0 25px var(--glow-primary); }
  100% { box-shadow: 0 0 20px var(--glow-primary); }
}

.skill-node.unlocked {
  animation: unlockPulse 0.3s ease;
}

---

END OF STEP 5