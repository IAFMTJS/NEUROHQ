# DARK COMMANDER – VISUAL COMPLETION LAYER v1.0

Final visual hardening layer.
Defines depth hierarchy, modal system, feedback styling, and state matrix.

No new design language allowed.

---

# 1. ELEVATION SYSTEM

Defines visual depth levels.

Elevation 0 → Base Background  
Elevation 1 → Card  
Elevation 2 → Active Card  
Elevation 3 → Modal  
Elevation 4 → Overlay  

---

## 1.1 Elevation Values

Elevation 1 (Card)
box-shadow: 0 8px 24px rgba(0,0,0,0.45);

Elevation 2 (Active Card)
box-shadow: 0 0 20px var(--glow-primary);

Elevation 3 (Modal)
box-shadow: 0 20px 60px rgba(0,0,0,0.65);

Elevation 4 (Overlay)
background: rgba(0,0,0,0.6);

No other shadow values allowed.

---

# 2. MODAL SYSTEM

## 2.1 Structure

<div class="overlay">
  <div class="modal">
    Modal Content
  </div>
</div>

---

## 2.2 Overlay

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

No blur allowed.

---

## 2.3 Modal

.modal {
  width: 90%;
  max-width: 380px;
  background: var(--bg-card);
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.65);
  animation: modalEnter 0.25s ease;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

---

# 3. TOAST SYSTEM

## 3.1 Structure

<div class="toast success">
  +120 XP Gained
</div>

---

## 3.2 Base Toast

.toast {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-soft);
  font-size: 13px;
  box-shadow: var(--shadow-card);
  animation: toastSlide 0.3s ease;
}

@keyframes toastSlide {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

---

## 3.3 Toast Variants

.toast.success {
  border: 1px solid var(--accent-primary);
}

.toast.warning {
  border: 1px solid var(--accent-amber);
}

.toast.error {
  border: 1px solid var(--accent-amber);
  opacity: 0.85;
}

No red color usage.

---

# 4. STATE MATRIX

## 4.1 Mission Card

Default
- Border: var(--border-soft)
- Shadow: Elevation 1
- Opacity: 1

Active
- Border: var(--accent-primary)
- Shadow: Elevation 2

Locked
- Border: var(--border-soft)
- Opacity: 0.4

Completed
- Border: var(--accent-cyan)
- No glow

---

## 4.2 Skill Node

Locked
- Opacity: 0.4

Unlocked
- Border: var(--accent-primary)
- Glow: Elevation 2

---

## 4.3 Energy Ring

Normal
- No extra glow

Low (<20)
- Inner glow amber

---

# 5. CHART VISUAL RULES

For future analytics screens.

Line Color → var(--accent-primary)  
Secondary Line → var(--accent-cyan)  

Grid Lines:
rgba(255,255,255,0.05)

Axis Text:
var(--text-soft)

Chart radius:
10px

No multi-color charts.
No gradient charts.
No filled bar glow effects.

---

# 6. EMPTY STATES

Empty Card Layout:

<div class="card empty">
  <p class="text-soft">No active missions.</p>
</div>

.empty {
  text-align: center;
  opacity: 0.6;
}

No icons in empty state.
Minimal only.

---

# 7. ERROR STATE

.card.error {
  border: 1px solid var(--accent-amber);
}

Text remains var(--text-main).
No red usage.

---

END OF VISUAL COMPLETION LAYER