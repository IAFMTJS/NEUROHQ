# DARK COMMANDER – STEP 7
Retention & Engagement System

This defines:
- Streak mechanic
- Rank tiers
- Achievement system
- Reward loop logic

No UI styling here.
Only progression psychology.

---

# 1. STREAK SYSTEM

Add to gameState:

streak: {
  current: 3,
  longest: 12,
  lastCompletionDate: "2026-02-16"
}

---

# 2. UPDATE STREAK FUNCTION

function updateStreak() {

  const today = new Date().toDateString();

  if (gameState.streak.lastCompletionDate === today) {
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (gameState.streak.lastCompletionDate === yesterday.toDateString()) {
    gameState.streak.current += 1;
  } else {
    gameState.streak.current = 1;
  }

  if (gameState.streak.current > gameState.streak.longest) {
    gameState.streak.longest = gameState.streak.current;
  }

  gameState.streak.lastCompletionDate = today;

}

---

# 3. RANK SYSTEM

Add to state:

rank: "Operator"

Rank tiers:

const ranks = [
  { name: "Recruit", levelRequired: 1 },
  { name: "Operator", levelRequired: 3 },
  { name: "Specialist", levelRequired: 6 },
  { name: "Commander", levelRequired: 10 },
  { name: "Elite Commander", levelRequired: 15 }
];

---

# 4. UPDATE RANK FUNCTION

function updateRank() {

  for (let i = ranks.length - 1; i >= 0; i--) {
    if (gameState.level >= ranks[i].levelRequired) {
      gameState.rank = ranks[i].name;
      break;
    }
  }

}

Call updateRank() inside levelUp().

---

# 5. ACHIEVEMENT SYSTEM

Add to state:

achievements: {
  firstMission: false,
  streak7: false,
  level10: false
}

---

# 6. CHECK ACHIEVEMENTS

function checkAchievements() {

  if (!gameState.achievements.firstMission &&
      gameState.missions.some(m => m.completed)) {
    gameState.achievements.firstMission = true;
  }

  if (!gameState.achievements.streak7 &&
      gameState.streak.current >= 7) {
    gameState.achievements.streak7 = true;
  }

  if (!gameState.achievements.level10 &&
      gameState.level >= 10) {
    gameState.achievements.level10 = true;
  }

}

Call after mission completion & level up.

---

# 7. REWARD LOOP STRUCTURE

Mission Complete →
+ XP →
Check Level →
Update Rank →
Check Achievements →
Trigger UI Feedback →
Save Game

This loop must always execute in this order.

---

# 8. OPTIONAL XP MULTIPLIER

Add bonus for streak:

function calculateXPWithBonus(baseXP) {
  const multiplier = 1 + (gameState.streak.current * 0.02);
  return Math.floor(baseXP * multiplier);
}

Cap multiplier at 1.5 max.

---

END OF STEP 7