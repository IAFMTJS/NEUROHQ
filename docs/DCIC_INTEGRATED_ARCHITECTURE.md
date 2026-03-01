# Dark Commander Intelligence Core - Integrated Architecture
## Combining DCIC v1.0, Language Engine v4.0 & v5.0

---

## EXECUTIVE SUMMARY

This document integrates three architecture specifications:
1. **DCIC v1.0** - Core behavior optimization system
2. **Language Engine v4.0** - Core system architecture
3. **Language Engine v5.0** - Morphology-driven deterministic intelligence

**Key Innovation**: v5.0 introduces morphology-driven approach replacing static word lists with root-based variant generation.

---

## ARCHITECTURE OVERVIEW

### System Flow (Integrated)

```
User Input
→ Normalization (lowercase, whitespace, stop words)
→ Tokenization (split into tokens)
→ Morphology Engine (generate verb variants from roots)
→ Entity Extraction (mission, task, time, date)
→ Signal Detection (resistance, fatigue, doubt, urgency)
→ Intent Scoring (weighted scoring with confidence)
→ Ambiguity Resolution (multi-intent splitting)
→ State Gatekeeper (pre-execution validation)
→ Action Builder (create Action Object)
→ Simulation Engine (preview consequences)
→ Confirmation Layer (require explicit confirmation)
→ Execution Core (mutate gameState ONLY here)
→ Behaviour Intelligence Update (log patterns)
→ Response Composer (generate response)
→ User Output
```

---

## STATE STRUCTURE

### gameState (Gameplay Core)
```typescript
interface GameState {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  stats: {
    energy: number;
    focus: number;
    load: number;
  };
  missions: Mission[];
  skills: Record<string, boolean>;
  streak: {
    current: number;
    longest: number;
    lastCompletionDate: string | null;
  };
  rank: string;
  achievements: Record<string, boolean>;
}
```

**CRITICAL**: gameState can ONLY be mutated inside Execution Core.

### assistantState (Conversation Intelligence)
```typescript
interface AssistantState {
  lastIntent: Intent | null;
  lastTopic: string | null;
  pendingAction: ActionObject | null;
  clarificationNeeded: boolean;
  recentEntities: {
    missionId: string | null;
    dateReference: string | null;
    taskId: string | null;
  };
  userSignals: {
    resistance: boolean;
    fatigue: boolean;
    doubt: boolean;
    urgency: boolean;
  };
  patterns: {
    averageStartTime: string | null;
    averageMissionDuration: number | null;
    streakBreakDay: string | null;
  };
}
```

**CRITICAL**: assistantState NEVER mutates gameplay directly.

### behaviourLog
```typescript
interface BehaviourLogEntry {
  date: string;
  missionStartedAt: string | null;
  missionCompletedAt: string | null;
  energyBefore: number;
  energyAfter: number;
  resistedBeforeStart: boolean;
  difficultyLevel: number;
}
```

---

## SECTION 1: MORPHOLOGY ENGINE (v5.0)

### Root Library

```typescript
const ROOT_LIBRARY = {
  MISSION_START_ROOTS: [
    "start", "begin", "activeer", "werk", "focus", "run", "pak", "doe"
  ],
  MISSION_COMPLETE_ROOTS: [
    "voltooi", "rond_af", "finish", "maak_af", "fix", "klaar"
  ],
  PLANNING_ROOTS: [
    "plan", "zet", "boek", "noteer", "reserveer", "voeg_toe"
  ],
  RESISTANCE_ROOTS: [
    "stel_uit", "vermijd", "skip", "stop", "wacht"
  ],
  STATUS_ROOTS: [
    "check", "toon", "geef", "laat_zien", "wat_is"
  ],
  GOAL_ROOTS: [
    "wil", "streef", "mik", "haal"
  ]
};
```

### Morphology Variant Generation

```typescript
function generateVerbVariants(root: string): string[] {
  const variants: string[] = [];
  
  // Base forms
  variants.push(root);
  variants.push(root + "en");
  
  // Present tense
  variants.push("ik " + root);
  variants.push("wij " + root + "en");
  
  // Past tense
  variants.push(root + "te");
  variants.push("ge" + root + "t");
  
  // Future/conditional
  variants.push("zal " + root + "en");
  variants.push("zou " + root + "en");
  
  // Modal combinations
  const modals = ["wil", "moet", "kan", "probeer"];
  modals.forEach(modal => {
    variants.push(modal + " " + root + "en");
    variants.push("ik " + modal + " " + root + "en");
    variants.push("ik " + modal + " niet " + root + "en");
  });
  
  // Negated
  variants.push("niet " + root + "en");
  variants.push("ik " + root + " niet");
  
  return variants;
}
```

### Template Engine

```typescript
const PHRASE_TEMPLATES = {
  T1: "IK [VERB]",
  T2: "IK [MODAL] [VERB]",
  T3: "IK [MODAL] NIET [VERB]",
  T4: "IK [VERB] [TIME]",
  T5: "[TIME] [VERB]",
  T6: "IK BEN [STATE]",
  T7: "HET IS [STATE]",
  T8: "IK WIL [GOAL]",
  T9: "KAN JE [ACTION]",
  T10: "[VERB] EN [VERB]"
};
```

---

## SECTION 2: PERCEPTION LAYER

### Normalization
- Lowercase conversion
- Remove stop words
- Synonym replacement
- Whitespace cleanup

### Token Weighting
- Verb tokens: weight 1.0
- Time tokens: weight 0.8
- Entity tokens: weight 0.6
- Modifiers: weight 0.3

### Time Parsing
Recognize:
- Relative: "morgen", "vandaag", "overmorgen"
- Days: "maandag", "dinsdag", etc.
- Times: "09:00", "9u", "om 9", "rond 8"

TimeSignal values:
- Exact time + date → 1.0
- Date only → 0.5
- None → 0

### Signal Detection

```typescript
interface DetectedSignals {
  resistance: boolean;
  fatigue: boolean;
  doubt: boolean;
  urgency: boolean;
}

const RESISTANCE_SIGNALS = [
  "geen zin", "later", "straks", "nu niet", 
  "ik wil niet", "ik stel uit", "skip", "laat maar"
];

const FATIGUE_SIGNALS = [
  "moe", "leeg", "kapot", "uitgeput", "geen energie"
];

const DOUBT_SIGNALS = [
  "misschien", "ik denk", "ik weet niet", "zou ik", "twijfel"
];

const URGENCY_SIGNALS = [
  "nu", "direct", "meteen", "asap"
];
```

---

## SECTION 3: INTENT SCORING ENGINE

### Intent Categories
- `start_mission`
- `complete_mission`
- `create_calendar_event`
- `ask_status`
- `resistance`
- `confirm_action`
- `unknown`

### Scoring Formula

```typescript
function scoreIntent(
  intent: Intent,
  verbMatch: number,
  entityMatch: number,
  timeSignal: number,
  contextBoost: number,
  signalModifier: number
): number {
  const weights = getIntentWeights(intent);
  
  return (
    (verbMatch * weights.verbWeight) +
    (entityMatch * weights.entityWeight) +
    (timeSignal * weights.timeWeight) +
    contextBoost +
    signalModifier
  );
}
```

### Weight Matrix

| Intent | VerbWeight | EntityWeight | TimeWeight |
|--------|------------|--------------|------------|
| start_mission | 0.5 | 0.3 | 0.1 |
| complete_mission | 0.6 | 0.3 | 0.0 |
| create_calendar_event | 0.4 | 0.3 | 0.3 |
| ask_status | 0.5 | 0.2 | 0.0 |
| resistance | 0.7 | 0.0 | 0.0 |

### Context Boost Rules
- Active mission present → +0.2 `complete_mission`
- Recent planning discussion → +0.2 `create_calendar_event`
- PendingAction exists → +0.3 `confirm_action`
- Max ContextBoost = 0.3

### Signal Modifiers
- Resistance detected → +0.2 `resistance`, -0.2 `start_mission`
- Fatigue detected → +0.1 `resistance`, -0.1 heavy mission intent
- Doubt detected → -0.15 confidence
- Urgency detected → +0.2 `start_mission`

### Confidence Rules
```typescript
const confidence = topScore - secondScore;

if (topScore < 0.6) → LOW CONFIDENCE → clarification
if (confidence < 0.15) → AMBIGUOUS → clarification
if (confidence >= 0.25) → STRONG → proceed
```

**SAFETY**: No action executed below 0.6 confidence.

---

## SECTION 4: AMBIGUITY & MULTI-INTENT

### Multi-Intent Detection
If pattern matches `"[VERB] EN [VERB]"`:
- Split into multiple intent candidates
- Each generates separate Action Object
- Each requires separate confirmation flow

### Ambiguity Resolution
If confidence margin < 0.15:
- Ask clarification: "Bedoel je missie starten of planning maken?"

---

## SECTION 5: STATE GATEKEEPER

Pre-execution validation:

```typescript
function validateAction(action: ActionObject, gameState: GameState): ValidationResult {
  switch (action.type) {
    case "complete_mission":
      if (!gameState.missions.some(m => m.active && !m.completed)) {
        return { valid: false, reason: "No active mission" };
      }
      if (gameState.stats.energy <= 5) {
        return { valid: false, reason: "Insufficient energy" };
      }
      break;
      
    case "start_mission":
      if (gameState.missions.some(m => m.active)) {
        return { valid: false, reason: "Mission already active" };
      }
      if (gameState.stats.energy <= 10) {
        return { valid: false, reason: "Insufficient energy" };
      }
      break;
      
    case "create_calendar_event":
      if (!action.data.date) {
        return { valid: false, reason: "Missing date" };
      }
      break;
  }
  
  return { valid: true };
}
```

---

## SECTION 6: ACTION OBJECT MODEL

```typescript
interface ActionObject {
  type: "start_mission" | "complete_mission" | "create_calendar_event" | "ask_status";
  priority: number;
  requiresConfirmation: boolean; // Always true for persistent actions
  data: {
    missionId?: string;
    date?: string;
    time?: string;
    // ... other action-specific data
  };
  simulation: SimulationResult | null;
}
```

**CRITICAL**: No execution allowed at Action Builder stage.

---

## SECTION 7: SIMULATION ENGINE

### Complete Mission Simulation

```typescript
interface SimulationResult {
  xpGain: number;
  newLevel: number;
  newRank: string;
  energyAfter: number;
  streakAfter: number;
  projectedAchievements: string[];
}

function simulateCompleteMission(
  mission: Mission,
  gameState: GameState
): SimulationResult {
  // Calculate streak multiplier (2% per day, capped at 50%)
  const streakMultiplier = Math.min(1 + (gameState.streak.current * 0.02), 1.5);
  
  const xpGain = Math.floor(mission.xpReward * streakMultiplier);
  const projectedXP = gameState.currentXP + xpGain;
  const newLevel = calculateLevel(projectedXP);
  const newRank = calculateRank(newLevel);
  const energyAfter = Math.max(0, gameState.stats.energy - mission.energyCost);
  const streakAfter = gameState.streak.current + 1;
  
  return {
    xpGain,
    newLevel,
    newRank,
    energyAfter,
    streakAfter,
    projectedAchievements: checkAchievements(gameState, newLevel, streakAfter)
  };
}
```

---

## SECTION 8: CONFIRMATION LAYER

Before execution, present:

```
Mission: Deep Work
XP Gain: +127
Energy After: 72
Streak After: 4

Bevestigen?
```

User must explicitly confirm.

---

## SECTION 9: EXECUTION CORE

**ONLY HERE** gameState mutates.

```typescript
async function executeCompleteMission(
  missionId: string,
  gameState: GameState
): Promise<void> {
  const mission = gameState.missions.find(m => m.id === missionId);
  if (!mission || mission.completed) return;
  
  // Mutate gameState
  mission.completed = true;
  mission.active = false;
  
  updateStreak(gameState);
  addXP(gameState, mission.xpReward);
  updateRank(gameState);
  checkAchievements(gameState);
  
  // Persist to database
  await saveGameState(gameState);
}
```

---

## SECTION 10: BEHAVIOUR INTELLIGENCE

### Metrics

```typescript
interface BehaviourMetrics {
  completionRate: number;      // completed / started (14 days)
  resistanceRate: number;      // resistanceSignals / 7 days
  energyEfficiency: number;     // xpGained / energySpent
  performanceScore: number;     // Normalized 0-1
}

function calculateCompletionRate(log: BehaviourLogEntry[]): number {
  const last14Days = log.filter(e => 
    isWithinDays(e.date, 14)
  );
  const started = last14Days.filter(e => e.missionStartedAt !== null).length;
  const completed = last14Days.filter(e => e.missionCompletedAt !== null).length;
  return started > 0 ? completed / started : 0;
}

function calculateResistanceRate(log: BehaviourLogEntry[]): number {
  const last7Days = log.filter(e => 
    isWithinDays(e.date, 7) && e.resistedBeforeStart
  );
  return last7Days.length / 7;
}

function calculateEnergyEfficiency(log: BehaviourLogEntry[]): number {
  const totalXP = log.reduce((sum, e) => sum + (e.xpGained || 0), 0);
  const totalEnergy = log.reduce((sum, e) => sum + (e.energyBefore - e.energyAfter), 0);
  return totalEnergy > 0 ? totalXP / totalEnergy : 0;
}

function calculatePerformanceScore(
  streak: number,
  completionRate: number,
  resistanceRate: number,
  energyEfficiency: number
): number {
  // Normalize all to 0-1
  const normalizedStreak = Math.min(streak / 30, 1);
  const normalizedEfficiency = Math.min(energyEfficiency / 10, 1);
  
  return (
    (normalizedStreak * 0.4) +
    (completionRate * 0.3) -
    (resistanceRate * 0.2) +
    (normalizedEfficiency * 0.1)
  );
}
```

### Streak Risk Model

```typescript
function calculateStreakRisk(
  patterns: AssistantState['patterns'],
  currentTime: Date
): number {
  if (!patterns.averageStartTime) return 0;
  
  const expectedStartTime = parseTime(patterns.averageStartTime);
  const normalizedDeviation = Math.min(
    Math.abs(currentTime.getTime() - expectedStartTime.getTime()) / (120 * 60 * 1000),
    1
  );
  
  const noMissionToday = !hasMissionToday();
  
  const risk = (0.6 * normalizedDeviation) + (noMissionToday ? 0.3 : 0);
  
  return Math.min(risk, 1);
}
```

---

## SECTION 11: ADAPTIVE DIFFICULTY

```typescript
function adjustDifficulty(
  completionRate: number,
  currentDifficulty: number
): number {
  if (completionRate > 0.9) {
    return Math.min(currentDifficulty + 0.1, 1.0);
  }
  if (completionRate < 0.5) {
    return Math.max(currentDifficulty - 0.1, 0.1);
  }
  return currentDifficulty;
}
```

Difficulty affects:
- XP reward
- Energy cost
- Duration recommendation

---

## SECTION 12: PROACTIVE TRIGGERS

Every X minutes (configurable, default 30):

```typescript
async function checkProactiveTriggers(
  gameState: GameState,
  assistantState: AssistantState,
  behaviourLog: BehaviourLogEntry[]
): Promise<TacticalSuggestion | null> {
  const streakRisk = calculateStreakRisk(assistantState.patterns, new Date());
  const resistanceTrend = calculateResistanceRate(behaviourLog);
  const energyDrop = detectEnergyDrop(behaviourLog);
  const noMissionToday = !hasMissionToday();
  
  if (streakRisk > 0.6) {
    return {
      type: "streak_risk",
      message: "Streak at risk. 1 mission secures 7-day chain.",
      priority: "high"
    };
  }
  
  if (resistanceTrend > 0.4) {
    return {
      type: "resistance_trend",
      message: "High avoidance detected. Consider shorter missions.",
      priority: "medium"
    };
  }
  
  if (noMissionToday && gameState.stats.energy > 10) {
    return {
      type: "no_mission",
      message: "No mission today. Start one to maintain momentum.",
      priority: "medium"
    };
  }
  
  return null;
}
```

---

## SECTION 13: RESPONSE STRUCTURE

```typescript
interface Response {
  coreMessage: string;
  stateFeedback: string;
  tacticalSuggestion: string | null;
  toneModifier: "short_direct" | "neutral" | "structured_guidance";
}

function generateResponse(
  action: ActionObject | null,
  gameState: GameState,
  assistantState: AssistantState,
  performanceScore: number
): Response {
  const tone = performanceScore > 0.75 ? "short_direct" :
               performanceScore > 0.4 ? "neutral" :
               "structured_guidance";
  
  return {
    coreMessage: generateCoreMessage(action),
    stateFeedback: generateStateFeedback(gameState),
    tacticalSuggestion: generateTacticalSuggestion(assistantState),
    toneModifier: tone
  };
}
```

---

## SECTION 14: SAFETY RULES

1. **No action below 0.6 confidence** → clarification required
2. **Ambiguity margin below 0.15** → clarification required
3. **All persistent actions require confirmation** → no auto-execution
4. **All actions must be simulated before execution** → preview consequences
5. **Only Execution Core may mutate gameState** → strict boundary
6. **assistantState never mutates gameplay directly** → separation of concerns

---

## IMPLEMENTATION PRIORITY

### Phase 1: Core Mission System (Week 1-2)
- [ ] Mission state model (active/completed)
- [ ] State Gatekeeper
- [ ] Basic Simulation Engine
- [ ] Confirmation UI

### Phase 2: Language Engine (Week 2-3)
- [ ] Morphology Engine
- [ ] Root Library
- [ ] Template Engine
- [ ] Enhanced Intent Scoring
- [ ] Ambiguity Resolver

### Phase 3: Intelligence Layer (Week 3-4)
- [ ] Behaviour Intelligence metrics
- [ ] Proactive Triggers
- [ ] Adaptive Difficulty
- [ ] Streak Risk Model

### Phase 4: Integration & Polish (Week 4-5)
- [ ] Integration with existing assistant
- [ ] UI for confirmation dialogs
- [ ] Response composer integration
- [ ] Testing & refinement

---

## MIGRATION STRATEGY

### Existing Code → DCIC

1. **Intent Classification**: Enhance `lib/assistant/intent.ts` with morphology engine
2. **Signal Extraction**: Extend `lib/assistant/signals.ts` with resistance/fatigue/doubt
3. **Entity Extraction**: Enhance `lib/assistant/entity-extraction.ts` with time parsing
4. **State Management**: Create `lib/dcic/game-state.ts` and `lib/dcic/assistant-state.ts`
5. **Simulation**: Create `lib/dcic/simulation.ts`
6. **Execution**: Create `lib/dcic/execution-core.ts`
7. **Behaviour Intelligence**: Extend `app/actions/behavior.ts` with new metrics

---

## FILE STRUCTURE

```
lib/
  dcic/
    morphology.ts          # Root library & variant generation
    perception.ts          # Normalization, tokenization, time parsing
    intent-scoring.ts      # Weighted intent scoring
    ambiguity.ts           # Multi-intent resolution
    state-gatekeeper.ts    # Pre-execution validation
    action-builder.ts      # Action Object creation
    simulation.ts          # Consequence simulation
    execution-core.ts      # gameState mutations ONLY
    behaviour-intelligence.ts  # Metrics & patterns
    proactive.ts           # Trigger checks
    response-composer.ts    # Response generation
    
  assistant/
    (existing files - integrate with DCIC)
    
app/
  actions/
    dcic/
      game-state.ts        # gameState CRUD
      assistant-state.ts   # assistantState CRUD
      missions.ts          # Mission management
      simulation.ts        # Simulation server actions
      execution.ts         # Execution server actions
```

---

---

## TEST SUITES

### Standard Test Suite
See `docs/DCIC_TEST_SUITE.md` for comprehensive test cases covering:
- Morphology engine validation
- Modal expansion
- Negation handling
- Time injection
- Ambiguity resolution
- Multi-intent splitting
- Conflict resolution
- Resistance detection
- Behavior triggers

**Total: 70+ core test cases**

### Chaos Test Suite
See `docs/DCIC_CHAOS_TEST_SUITE.md` for edge cases designed to break weak systems:
- Noise + modal + time mix
- Double/triple negation
- Partial contradictions
- Multi-intent chaos
- Time confusion
- Resistance with goal pressure
- Random structure breakers
- Sarcastic/meta input
- Extreme morphology stress
- Complete chaos mode

**Total: 70+ chaos test cases**

**Critical Validation**: Engine must pass chaos suite without executing wrong actions or actions below confidence threshold.

---

## END OF INTEGRATED ARCHITECTURE