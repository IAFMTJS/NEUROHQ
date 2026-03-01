# DARK COMMANDER – LAYOUT LOCK SPEC v1.0

This file defines exact positioning and size relationships.
No element may deviate.

---

# 1. GLOBAL CONTAINER

Max width (mobile): 420px  
Margin: 0 auto  
Padding top: 24px  
Padding sides: 24px  
Padding bottom: 100px (to clear nav)

.container {
  max-width: 420px;
  margin: 0 auto;
  padding: 24px 24px 100px 24px;
}

---

# 2. HEADER

Top margin: 0  
Spacing below header: 24px  

Header title size: 28px  
Subtitle spacing below title: 4px  

---

# 3. MASCOT SECTION

Card padding: 32px  
Mascot container size: 140px (default)  
Max mascot size: 160px  
Center aligned  

Spacing below mascot section: 24px  

---

# 4. STAT SECTION

.stat-ring size: 100px  
Inner circle size: 75px  

Layout:

.stats {
  display: flex;
  justify-content: space-between;
}

Gap between stat rings: auto (evenly spaced)

Spacing below stats: 24px  

---

# 5. PRIMARY BUTTON

Full width of container  
Height: approx 52px  
Border radius: 14px  

Spacing above button: 0  
Spacing below button: 24px  

---

# 6. STATUS CARD

Full width  
Padding: 20px  
Progress bar height: 6px  
Spacing between title and progress: 12px  
Spacing between progress and caption: 8px  

---

# 7. MISSION GRID

Grid: 2 columns  
Gap: 20px  

Card height: auto  
Minimum height: 120px  

---

# 8. SKILL TREE

Node size: 120px  
Connector height: 40px  
Vertical spacing: 24px  

XP card above tree: 24px spacing  

---

# 9. BOTTOM NAV

Height: 70px  
Position: fixed bottom  
Width: 100%  
Icon size: 24px  
Text size: 12px  
Gap icon-text: 4px  

---

# 10. SAFE AREA RULE

On iOS:
Add padding-bottom: env(safe-area-inset-bottom);

---

# 11. SPACING HIERARCHY RULE

Section-to-section: 24px  
Component-to-component: 20px  
Micro-spacing: 8px / 12px  

No other spacing allowed.

---

END OF LAYOUT LOCK SPEC