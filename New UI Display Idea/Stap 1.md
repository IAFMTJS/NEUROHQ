# DARK COMMANDER DESIGN SYSTEM v1.0

System-based cinematic UI for reproducible builds.
All values are fixed. Do not improvise.

---

# 1. DESIGN PRINCIPLES

- Cinematic but controlled
- Dark tactical interface
- Single dominant light source
- No heavy blur effects
- No multiple random glows
- Consistent spacing scale
- Token-based styling only

If a value is not defined here → do not invent it.

---

# 2. DESIGN TOKENS

## 2.1 Colors

:root {

  /* Backgrounds */
  --bg-main: #070A12;
  --bg-elevated: #0F1623;
  --bg-card: #111827;

  /* Accent Colors */
  --accent-primary: #2563EB;
  --accent-primary-dark: #1D4ED8;
  --accent-cyan: #22D3EE;
  --accent-amber: #F59E0B;

  /* Text */
  --text-main: #E5E7EB;
  --text-soft: #9CA3AF;

  /* Borders */
  --border-soft: rgba(255,255,255,0.06);

  /* Glows */
  --glow-primary: rgba(37,99,235,0.35);
  --glow-cyan: rgba(34,211,238,0.35);
}

---

## 2.2 Spacing Scale (STRICT)

Only use these values:

4px
8px
12px
16px
20px
24px
32px
40px

No 18px. No 22px. No creative spacing.

---

## 2.3 Border Radius

Cards: 18px  
Buttons: 14px  
Small elements: 10px  
Circles: 50%

No variation.

---

## 2.4 Shadows

--shadow-card: 0 8px 24px rgba(0,0,0,0.45);
--shadow-button: 0 6px 18px var(--glow-primary);

---

## 2.5 Typography Scale

Font family: Inter, system-ui, sans-serif

H1: 28px / 600  
H2: 22px / 600  
H3: 18px / 600  
Body: 16px / 400  
Small: 13px / 400  
Caption: 12px / 400  

Letter spacing: default  
No stylized spacing.

---

# 3. CORE COMPONENT DEFINITIONS

---

## 3.1 Container Layout

.container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--bg-main);
  min-height: 100vh;
}

---

## 3.2 Tactical Card

.card {
  background: var(--bg-card);
  border-radius: 18px;
  padding: 20px;
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
  position: relative;
}

.card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20%;
  width: 60%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--accent-primary),
    transparent
  );
}

---

## 3.3 Primary Button

.primary-btn {
  background: linear-gradient(
    180deg,
    var(--accent-primary),
    var(--accent-primary-dark)
  );
  border-radius: 14px;
  padding: 16px;
  color: white;
  font-weight: 600;
  border: none;
  box-shadow: var(--shadow-button);
  transition: 0.2s ease;
}

.primary-btn:hover {
  transform: translateY(-2px);
}

---

## 3.4 Stat Rings

.stat-ring {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.energy {
  background: conic-gradient(
    var(--accent-cyan) 0% 82%,
    rgba(255,255,255,0.05) 82% 100%
  );
}

.focus {
  background: conic-gradient(
    var(--accent-primary) 0% 65%,
    rgba(255,255,255,0.05) 65% 100%
  );
}

.load {
  background: conic-gradient(
    var(--accent-amber) 0% 30%,
    rgba(255,255,255,0.05) 30% 100%
  );
}

.stat-inner {
  width: 75px;
  height: 75px;
  background: var(--bg-main);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

---

## 3.5 Progress Bar

.progress {
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-primary);
}

---

## 3.6 Bottom Navigation

.bottom-nav {
  background: var(--bg-elevated);
  border-top: 1px solid var(--border-soft);
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
}

.nav-item {
  color: var(--text-soft);
  font-size: 12px;
}

.nav-item.active {
  color: var(--accent-primary);
}

---

# 4. LAYOUT BLUEPRINT — HOME SCREEN

Structure:

Header  
Mascot Section  
Stat Section  
Primary Action Button  
Brain Status Card  
Bottom Navigation  

---

## 4.1 Stats Layout

.stats {
  display: flex;
  justify-content: space-between;
}

---

## 4.2 Section Spacing Rules

Each major section uses:
gap: 24px

Cards stack with:
gap: 20px

No arbitrary spacing allowed.

---

# 5. RESTRICTIONS

Do NOT use:
- backdrop-filter
- heavy blur
- multiple layered shadows
- multiple glow layers
- random gradients
- inconsistent spacing

All visual elements must reference tokens.

---

END OF STEP 1 FOUNDATION