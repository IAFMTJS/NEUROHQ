# DARK COMMANDER – VISUAL MICRO SYSTEM v1.0

Defines:
- Icon system
- Badge system
- Rank visuals
- Micro feedback elements
- UI detail discipline

No improvisation allowed.

---

# 1. ICON SYSTEM

## 1.1 Icon Rules

- Use outline icons only
- Stroke width: 1.5px
- Size: 24px default
- No filled icons
- No mixing icon libraries
- Use Lucide or Heroicons Outline only (choose one globally)

Color rules:
- Default: var(--text-soft)
- Active: var(--accent-primary)
- Disabled: opacity 0.4
- Never use raw hex values outside tokens

---

## 1.2 Required Icons

Home → house
Missions → target
Growth → trending-up
Energy → zap
XP → star
Achievements → trophy
Rank → shield

All must follow same stroke style.

---

# 2. NAVIGATION ICON SPEC

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.nav-item svg {
  width: 24px;
  height: 24px;
}

.nav-item.active svg {
  color: var(--accent-primary);
}

---

# 3. BADGE SYSTEM

## 3.1 Notification Dot

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-amber);
  position: absolute;
  top: 4px;
  right: 4px;
}

Used for:
- New achievement
- Rank upgrade
- Unclaimed reward

---

## 3.2 Rank Badge

.rank-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--accent-primary);
}

---

# 4. ACHIEVEMENT MEDAL

.achievement-card {
  background: var(--bg-card);
  border-radius: 18px;
  padding: 20px;
  border: 1px solid var(--border-soft);
  display: flex;
  align-items: center;
  gap: 16px;
}

.achievement-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px var(--glow-primary);
}

---

# 5. XP FLOATING TEXT

When XP is gained:

@keyframes xpFloat {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-10px);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

.xp-float {
  position: absolute;
  color: var(--accent-cyan);
  font-weight: 600;
  animation: xpFloat 0.8s ease forwards;
}

---

# 6. ENERGY WARNING STATE

If energy < 20:

.energy.low {
  box-shadow: 0 0 20px var(--accent-amber);
}

No red panic animations.
Keep it tactical.

---

# 7. HEADER MICRO DETAIL

Section headers may use subtle accent bar:

.section-title {
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 4px;
  height: 60%;
  background: var(--accent-primary);
  transform: translateY(-50%);
  border-radius: 4px;
}

---

# 8. MASCOT LIGHT SPEC

.mascot-wrapper {
  box-shadow:
    0 0 30px var(--glow-cyan),
    0 10px 30px rgba(0,0,0,0.6);
}

Mascot must:
- Stay centered
- Not exceed 160px container
- Not use extra blur layers
- Not use multiple glow colors

---

# 9. MICRO CONSISTENCY RULES

- All circles must use 50% radius
- All badges use 10px radius
- All cards use 18px radius
- No element may introduce new glow colors
- No element may use new shadow values

If a new UI element is created:
It must inherit from existing token rules.

---

END OF VISUAL MICRO SYSTEM