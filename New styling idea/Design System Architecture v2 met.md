## Design System Architecture v2 met:  
	•	Token layers  
	•	Alias system  
	•	Component API schema  
	•	State matrix  
	•	Interaction state machine  
	•	Accessibility tokens  
	•	Motion contract  
	•	Haptic mapping  
	•	Layout blueprints  
	•	Theming engine  
	•	Style Dictionary compatible export  
  
Ik ga het structureren alsof het een echte enterprise design system repo is.  
  
Lees dit niet als inspiratie.  
Dit is execution infrastructure.  
  
⸻  
##   
**COMMANDER DESIGN SYSTEM v2**  
  
⸻  
##   
**1. TOKEN ARCHITECTURE STRUCTUUR**  
##   
## We gebruiken 4 lagen:  
	1.	Primitive  
	2.	Semantic  
	3.	Component  
	4.	Theme  
  
Geen component mag direct primitive gebruiken.  
Alles gaat via semantic layer.  
  
⸻  
##   
**2. COMPLETE TOKEN JSON (ENTERPRISE STRUCTUUR)**  
  
```
{
  "meta": {
    "system": "CommanderDesignSystem",
    "version": "2.0.0",
    "gridBase": 8,
    "device": {
      "baseWidth": 393,
      "baseHeight": 852,
      "safeAreaTop": 59,
      "safeAreaBottom": 34
    }
  },

  "primitive": {
    "color": {
      "neutral": {
        "900": { "value": "#050A16" },
        "800": { "value": "#0B1228" },
        "700": { "value": "#111A38" },
        "600": { "value": "#16204A" }
      },
      "cyan": {
        "500": { "value": "#00E5FF" },
        "400": { "value": "#38F0FF" }
      },
      "purple": {
        "500": { "value": "#6C5CE7" },
        "400": { "value": "#8E7CFF" }
      },
      "green": {
        "500": { "value": "#00FFA3" }
      },
      "amber": {
        "500": { "value": "#FFB84D" }
      },
      "red": {
        "500": { "value": "#FF4D6D" }
      },
      "white": { "value": "#FFFFFF" }
    },

    "spacing": {
      "0": { "value": 0 },
      "1": { "value": 8 },
      "2": { "value": 16 },
      "3": { "value": 24 },
      "4": { "value": 32 },
      "5": { "value": 40 },
      "6": { "value": 48 },
      "7": { "value": 64 }
    },

    "radius": {
      "xs": { "value": 8 },
      "sm": { "value": 12 },
      "md": { "value": 18 },
      "lg": { "value": 22 },
      "xl": { "value": 28 },
      "full": { "value": 999 }
    },

    "opacity": {
      "100": { "value": 1 },
      "80": { "value": 0.8 },
      "60": { "value": 0.6 },
      "40": { "value": 0.4 },
      "20": { "value": 0.2 }
    }
  },

  "semantic": {
    "background": {
      "primary": { "value": "{primitive.color.neutral.900.value}" },
      "secondary": { "value": "{primitive.color.neutral.800.value}" },
      "elevated": { "value": "rgba(18,28,58,0.75)" },
      "overlay": { "value": "rgba(8,12,24,0.85)" }
    },

    "text": {
      "primary": { "value": "{primitive.color.white.value}" },
      "secondary": { "value": "#A9B4D0" },
      "muted": { "value": "#6C7898" }
    },

    "border": {
      "subtle": { "value": "rgba(0,229,255,0.12)" },
      "active": { "value": "rgba(0,229,255,0.4)" }
    },

    "status": {
      "success": { "value": "{primitive.color.green.500.value}" },
      "warning": { "value": "{primitive.color.amber.500.value}" },
      "danger": { "value": "{primitive.color.red.500.value}" },
      "info": { "value": "{primitive.color.cyan.500.value}" }
    }
  }
}

```
  
  
⸻  
##   
**3. COMPONENT STATE MATRIX**  
  
Elke component heeft deze states:  
  
**State**	**Description**  
default	Idle state  
hover	Pointer over  
active	Pressed  
focus	Keyboard focus  
disabled	Non-interactive  
loading	Async state  
success	Completed action  
error	Failed action  
  
Voor button_primary:  
  
```
{
  "button_primary": {
    "states": {
      "default": {
        "gradient": "primary_cta",
        "shadow": "purple_glow",
        "scale": 1
      },
      "hover": {
        "shadow": "button_active",
        "scale": 1.02
      },
      "active": {
        "brightness": -0.1,
        "scale": 0.98
      },
      "disabled": {
        "opacity": 0.4,
        "shadow": "none"
      },
      "loading": {
        "spinner": true,
        "textOpacity": 0
      }
    }
  }
}

```
  
  
⸻  
##   
**4. COMPONENT API CONTRACT**  
  
Voor React Native:  
  
ButtonPrimary Props:  
  
```
{
  label: string,
  onPress: function,
  disabled?: boolean,
  loading?: boolean,
  size?: "default" | "small",
  haptic?: "light" | "medium" | "heavy"
}

```
  
EnergyRing Props:  
  
```
{
  value: number (0-100),
  type: "energy" | "focus" | "load",
  animated?: boolean
}

```
  
MissionCard Props:  
  
```
{
  title: string,
  duration: string,
  energyCost: number,
  focusCost: number,
  loadCost: number,
  recommended?: boolean
}

```
  
  
⸻  
##   
**5. MOTION SYSTEM CONTRACT**  
##   
## Global timings:  
	•	micro: 120ms  
	•	standard: 250ms  
	•	slow: 600ms  
	•	breathing: 2500ms loop  
  
Easing:  
	•	standard: cubic-bezier(0.4, 0.0, 0.2, 1)  
	•	accelerate: cubic-bezier(0.4, 0.0, 1, 1)  
	•	decelerate: cubic-bezier(0.0, 0.0, 0.2, 1)  
  
Energy bar fill animation:  
	•	from 0  
	•	to value  
	•	duration: 600ms  
	•	delay: 80ms stagger  
  
Mascot breathing:  
	•	scale 1 → 1.01  
	•	loop infinite  
	•	duration 3000ms  
  
⸻  
##   
**6. HAPTIC FEEDBACK MAPPING**  
  
**Action**	**Haptic**  
Button press	light  
Mission start	medium  
XP gained	medium  
Level up	heavy  
Error state	heavy  
  
  
⸻  
##   
**7. ACCESSIBILITY TOKENS**  
##   
## Minimum contrast ratio:  
	•	Text primary on background: 4.5:1  
	•	Large text: 3:1  
  
Touch target:  
Minimum height: 44pt  
  
Reduced motion:  
If system prefers-reduced-motion = true:  
	•	Disable breathing animation  
	•	Reduce all durations to 120ms  
	•	Remove glow pulsations  
  
⸻  
##   
**8. THEMING LAYER**  
##   
## Support:  
	•	Dark (default)  
	•	UltraDark  
	•	Minimal Mode  
  
Theme example:  
  
```
{
  "theme_dark": {
    "background_primary": "{semantic.background.primary}",
    "accent_primary": "{primitive.color.cyan.500}"
  },
  "theme_minimal": {
    "background_primary": "#000000",
    "accent_primary": "#FFFFFF"
  }
}

```
  
  
⸻  
##   
**9. LAYOUT BLUEPRINT PER SCREEN**  
##   
## HQ Layout Grid:  
	•	Section spacing: 32  
	•	Internal card spacing: 16  
	•	Horizontal padding: 24  
	•	Max card width: full  
  
Component order fixed. No rearranging.  
  
⸻  
##   
**10. STATE MACHINE (MISSION FLOW)**  
##   
## States:  
##   
## idle  
## → suggested  
## → preparing  
## → active  
## → paused  
## → completed  
## → rewarded  
##   
## Transitions strictly defined.  
  
⸻  
