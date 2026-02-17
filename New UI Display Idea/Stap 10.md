# DARK COMMANDER – RESPONSIVE SYSTEM v1.0

Defines:
- Breakpoints
- Scaling rules
- Grid behavior
- Typography scaling
- Layout protection

No uncontrolled fluid scaling.

---

# 1. BREAKPOINTS

Small Mobile: max-width 375px
Standard Mobile: 376px – 420px
Large Mobile: 421px – 480px
Tablet: 481px – 768px

No desktop layout defined.

---

# 2. CONTAINER RULE

.container {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

Tablet override:

@media (min-width: 481px) {
  .container {
    max-width: 520px;
  }
}

---

# 3. STAT RINGS RESPONSIVE

Default: 100px

@media (max-width: 375px) {
  .stat-ring {
    width: 85px;
    height: 85px;
  }

  .stat-inner {
    width: 65px;
    height: 65px;
  }
}

Do NOT scale above 100px on larger screens.

---

# 4. GRID COLLAPSE RULE

Mission grid collapses to 1 column on small devices:

@media (max-width: 375px) {
  .mission-grid {
    grid-template-columns: 1fr;
  }
}

---

# 5. SKILL TREE PROTECTION

Nodes remain 120px.

If screen < 360px:

.skill-node {
  width: 100px;
  height: 100px;
}

Connector scales to 30px.

---

# 6. TYPOGRAPHY ADJUSTMENT

On very small screens:

@media (max-width: 375px) {

  h1 {
    font-size: 24px;
  }

  h2 {
    font-size: 20px;
  }

}

Body text does not scale.

---

# 7. NAV SAFE AREA

.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}

Height remains 70px.

---

# 8. PREVENT OVERFLOW

Global rule:

img, svg {
  max-width: 100%;
  height: auto;
}

All cards:
overflow: hidden;

---

# 9. REDUCED MOTION SUPPORT

@media (prefers-reduced-motion: reduce) {

  * {
    animation: none !important;
    transition: none !important;
  }

}

---

# 10. HIGH CONTRAST MODE

@media (prefers-contrast: more) {

  .card {
    border: 1px solid rgba(255,255,255,0.2);
  }

  .mission-card.active {
    box-shadow: 0 0 25px var(--accent-primary);
  }

}

---

END OF RESPONSIVE SYSTEM