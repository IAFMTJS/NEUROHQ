# DARK COMMANDER – STEP 6
Core Engine (State + XP + Level System)

This file defines:
- Global state structure
- XP calculation
- Level progression
- Mission completion logic
- Unlock system

No UI logic here.
Only game logic.

---

# 1. GLOBAL STATE STRUCTURE

const gameState = {
  level: 4,
  currentXP: 720,
  xpToNextLevel: 1000,

  stats: {
    energy: 82,
    focus: 65,
    load: 30
  },

  missions: [
    {
      id: 1,
      name: "Deep Work Protocol",
      xpReward: 120,
      completed: false,
      active: true
    },
    {
      id: 2,
      name: "Cold Exposure",
      xpReward: 80,
      completed: false,
      active: false
    }
  ],

  skills: {
    focus1: true,
    focus2: false,
    deepFocus: false
  }
};

---

# 2. COMPLETE MISSION FUNCTION

function completeMission(missionId) {

  const mission = gameState.missions.find(m => m.id === missionId);

  if (!mission || mission.completed) return;

  mission.completed = true;

  addXP(mission.xpReward);

}

---

# 3. XP ADD FUNCTION

function addXP(amount) {

  gameState.currentXP += amount;

  if (gameState.currentXP >= gameState.xpToNextLevel) {
    levelUp();
  }

}

---

# 4. LEVEL UP LOGIC

function levelUp() {

  gameState.currentXP -= gameState.xpToNextLevel;
  gameState.level += 1;

  gameState.xpToNextLevel = calculateNextXP(gameState.level);

}

---

# 5. XP SCALING FORMULA

function calculateNextXP(level) {
  return Math.floor(1000 * Math.pow(1.15, level - 4));
}

Scaling increases 15% per level.

---

# 6. UNLOCK SKILL

function unlockSkill(skillKey) {

  if (!gameState.skills[skillKey]) {
    gameState.skills[skillKey] = true;
  }

}

---

# 7. ENERGY DRAIN SYSTEM

function drainEnergy(amount) {
  gameState.stats.energy = Math.max(0, gameState.stats.energy - amount);
}

---

# 8. DAILY RESET SYSTEM

function dailyReset() {

  gameState.missions.forEach(m => {
    m.completed = false;
  });

  gameState.stats.energy = 100;

}

---

# 9. SAVE / LOAD SYSTEM (LOCAL STORAGE)

function saveGame() {
  localStorage.setItem("darkCommanderState", JSON.stringify(gameState));
}

function loadGame() {
  const saved = localStorage.getItem("darkCommanderState");
  if (saved) {
    Object.assign(gameState, JSON.parse(saved));
  }
}

---

END OF STEP 6