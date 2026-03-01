# DARK COMMANDER – EFFECT LIBRARY v1.0

Defines ALL allowed visual effects.

If an effect is not defined here → it is forbidden.

Goal:
Cinematic. Controlled. Tactical.
No chaos. No glow spam.

---

# 1. GLOBAL LIGHT SOURCE RULE

All visual lighting must suggest ONE directional source.

Primary direction: Top-center or bottom-center.

Never:
- Light from left and right simultaneously
- Multi-color glow stacks
- Random radial glow backgrounds

Cinematic = controlled light.

---

# 2. GLOW SYSTEM

Only 3 glow types are allowed.

---

## 2.1 PRIMARY GLOW

Usage:
- Active mission
- Unlocked skill
- Rank highlight
- Button emphasis (subtle)

Value:
box-shadow: 0 0 20px var(--glow-primary);

Max blur radius: 25px

Never stack multiple primary glows.

---

## 2.2 CYAN ENERGY GLOW

Usage:
- Energy stat ring
- Energy low warning (inner glow)
- XP gain micro effect

Value:
box-shadow: 0 0 18px var(--glow-cyan);

Energy low override:
box-shadow: 0 0 20px var(--accent-amber);

No permanent cyan glow on cards.

---

## 2.3 MODAL DEPTH GLOW

Usage:
- Modal container only

Value:
box-shadow: 0 20px 60px rgba(0,0,0,0.65);

Never use this glow outside modal context.

---

# 3. NEON EFFECT (STRICTLY LIMITED)

Neon is TEMPORARY only.
Used during:
- Achievement unlock
- Level up
- Rank promotion

Never permanent.

---

## 3.1 Neon Text

text-shadow:
0 0 6px var(--accent-primary),
0 0 12px var(--accent-primary);

Duration:
max 1 second animation

No infinite neon effects allowed.

---

## 3.2 Neon Ring Pulse

@keyframes neonPulse {
  0% { box-shadow: 0 0 0px var(--glow-primary); }
  50% { box-shadow: 0 0 25px var(--glow-primary); }
  100% { box-shadow: 0 0 0px var(--glow-primary); }
}

Only used for:
- Skill unlock
- Level up moment

Never idle looping.

---

# 4. GLASS SYSTEM

Glass is optional and limited.

Allowed only for:
- Modal background
- Overlay panels
- Onboarding intro card

Never for:
- Standard cards
- Mission grid
- Skill nodes

---

## 4.1 Glass Values

background: rgba(17,24,39,0.8);
backdrop-filter: blur(10px);
border: 1px solid rgba(255,255,255,0.08);

Blur max: 12px

No multi-layer glass stacking.
No glass on top of glass.

---

# 5. 3D ILLUSION SYSTEM

True 3D transforms are forbidden.

Allowed 3D illusion techniques:

- Shadow depth
- Inner highlight
- Subtle gradient

---

## 5.1 Button Depth

background: linear-gradient(
  180deg,
  var(--accent-primary),
  var(--accent-primary-dark)
);

inset highlight:
inset 0 1px 0 rgba(255,255,255,0.1);

No perspective transforms.
No rotateX or rotateY.
No bevel borders.

---

## 5.2 Card Subtle Depth

Optional:
inset 0 1px 0 rgba(255,255,255,0.03);

Only for elevation 1 cards.

---

# 6. BACKGROUND LIGHTING

Allowed:

radial-gradient(
  circle at 50% 20%,
  rgba(37,99,235,0.12),
  transparent 60%
)

Max opacity: 0.15

No star fields.
No particle effects.
No animated backgrounds.

---

# 7. PROHIBITED EFFECTS

The following are banned:

- Multi-color glow stacking
- Rainbow gradients
- Gradient borders
- Heavy blur backgrounds
- Background animations
- Rotating UI elements
- Continuous pulsing UI
- Glow larger than 25px
- Drop shadows outside defined elevation system
- Skeuomorphic bevels
- Glass on every card

If used → violates system integrity.

---

# 8. EFFECT INTENSITY CAPS

Glow opacity max: 0.4  
Glow blur max: 25px  
Backdrop blur max: 12px  
Animation duration max: 0.8s  

No infinite looping except subtle energy ring pulse.

---

# 9. EFFECT PRIORITY RULE

Only ONE element per screen may have strong glow at a time.

Priority order:
1. Modal
2. Active mission
3. Skill unlock
4. Energy warning

Never multiple high-intensity glows simultaneously.

---

# 10. CINEMATIC BALANCE PRINCIPLE

Effects must:
- Guide attention
- Indicate importance
- Reinforce progression

Effects must NOT:
- Decorate randomly
- Exist without functional meaning
- Compete visually

If an effect does not serve UX hierarchy → remove it.

---

END OF EFFECT LIBRARY