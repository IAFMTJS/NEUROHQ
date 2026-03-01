# DARK COMMANDER – STEP 4
Motion & Interaction System

Motion must feel tactical, controlled, intentional.
No flashy game animations.
No bounce.
No elastic.
No random fade spam.

---

# 1. GLOBAL TRANSITION RULE

All interactive elements use:

transition: 0.2s ease;

Never exceed 0.3s.

---

# 2. BUTTON FEEDBACK

.primary-btn:active {
  transform: scale(0.98);
}

.primary-btn:hover {
  filter: brightness(1.1);
}

---

# 3. CARD HOVER LIFT

.card:hover,
.mission-card:hover {
  transform: translateY(-4px);
}

---

# 4. STAT RING ENERGY PULSE

@keyframes energyPulse {
  0% {
    box-shadow: 0 0 0px var(--glow-cyan);
  }
  50% {
    box-shadow: 0 0 18px var(--glow-cyan);
  }
  100% {
    box-shadow: 0 0 0px var(--glow-cyan);
  }
}

.stat-ring.energy {
  animation: energyPulse 3s infinite ease-in-out;
}

Do NOT apply pulse to all rings.
Only energy ring.

---

# 5. PAGE TRANSITION (FADE + SLIDE)

.page {
  animation: pageEnter 0.25s ease;
}

@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

Each screen wrapper should use class="page".

---

# 6. NAVIGATION ACTIVE INDICATOR ANIMATION

.nav-item.active {
  position: relative;
}

.nav-item.active::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 25%;
  width: 50%;
  height: 2px;
  background: var(--accent-primary);
  animation: navFade 0.2s ease;
}

@keyframes navFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

---

# 7. MISSION ACTIVATION EFFECT

When mission becomes active:

.mission-card.active {
  animation: activateGlow 0.3s ease;
}

@keyframes activateGlow {
  from {
    box-shadow: 0 0 0px var(--glow-primary);
  }
  to {
    box-shadow: 0 0 20px var(--glow-primary);
  }
}

---

# 8. MOTION RESTRICTIONS

Do NOT use:
- Bounce animations
- Infinite scaling
- Large movement distances
- Rotation effects
- Overshoot easing
- Multiple layered animations

All motion must feel:
Controlled.
Intentional.
Military clean.

---

END OF STEP 4