# Dark Commander Language Engine - Official Test Suite v1.0

## Purpose

This test suite validates:
- Morphology engine (root-based variant generation)
- Modal expansion
- Negation handling
- Time injection
- Ambiguity resolution
- Multi-intent splitting
- Conflict resolution
- Resistance detection
- Behavior triggers

**Total: 70+ core test cases**

---

## Test Format

Each test contains:
- `INPUT`: User message
- `EXPECTED_INTENT`: Primary intent classification
- `EXPECTED_CONFIDENCE`: Confidence level (strong/medium/low/reduced)
- `EXPECTED_BEHAVIOR`: Additional behavior (confirmation, clarification, etc.)
- `NOTES`: Implementation notes

---

## SECTION 1 — PURE START (DIRECT)

### Test 1.1
```typescript
INPUT: "Ik start"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "strong"
NOTES: direct verb
```

### Test 1.2
```typescript
INPUT: "Ik begin"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "strong"
```

### Test 1.3
```typescript
INPUT: "Start missie"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "strong"
```

### Test 1.4
```typescript
INPUT: "Ik ga starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "strong"
```

### Test 1.5
```typescript
INPUT: "We beginnen nu"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "strong"
```

### Test 1.6
```typescript
INPUT: "Tijd om te starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "strong"
```

### Test 1.7
```typescript
INPUT: "Activeer missie"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "strong"
```

### Test 1.8
```typescript
INPUT: "Run deep work"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "strong"
```

---

## SECTION 2 — MODAL VARIANTS

### Test 2.1
```typescript
INPUT: "Ik wil starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "medium"
```

### Test 2.2
```typescript
INPUT: "Ik moet beginnen"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "medium"
```

### Test 2.3
```typescript
INPUT: "Ik kan starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "medium"
```

### Test 2.4
```typescript
INPUT: "Ik zou starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "low-medium"
```

### Test 2.5
```typescript
INPUT: "Ik ga proberen te starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "medium"
```

### Test 2.6
```typescript
INPUT: "Ik denk dat ik ga starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "reduced"
NOTES: doubt modifier applies
```

---

## SECTION 3 — NEGATION

### Test 3.1
```typescript
INPUT: "Ik start niet"
EXPECTED_INTENT: "resistance"
EXPECTED_CONFIDENCE: "strong"
```

### Test 3.2
```typescript
INPUT: "Ik wil niet starten"
EXPECTED_INTENT: "resistance"
EXPECTED_CONFIDENCE: "strong"
```

### Test 3.3
```typescript
INPUT: "Niet beginnen vandaag"
EXPECTED_INTENT: "resistance"
EXPECTED_CONFIDENCE: "strong"
```

### Test 3.4
```typescript
INPUT: "Ik ga niet starten"
EXPECTED_INTENT: "resistance"
EXPECTED_CONFIDENCE: "strong"
```

---

## SECTION 4 — COMPLETION

### Test 4.1
```typescript
INPUT: "Ik ben klaar"
EXPECTED_INTENT: "complete_mission"
EXPECTED_CONFIDENCE: "strong"
```

### Test 4.2
```typescript
INPUT: "Missie afgerond"
EXPECTED_INTENT: "complete_mission"
EXPECTED_CONFIDENCE: "strong"
```

### Test 4.3
```typescript
INPUT: "Het zit erop"
EXPECTED_INTENT: "complete_mission"
EXPECTED_CONFIDENCE: "strong"
```

### Test 4.4
```typescript
INPUT: "Done"
EXPECTED_INTENT: "complete_mission"
EXPECTED_CONFIDENCE: "medium"
```

### Test 4.5
```typescript
INPUT: "Ik heb het gedaan"
EXPECTED_INTENT: "complete_mission"
EXPECTED_CONFIDENCE: "strong"
```

---

## SECTION 5 — PARTIAL COMPLETE

### Test 5.1
```typescript
INPUT: "Ik ben bijna klaar"
EXPECTED_INTENT: "complete_mission"
EXPECTED_CONFIDENCE: "reduced"
NOTES: partial modifier
```

### Test 5.2
```typescript
INPUT: "Nog even"
EXPECTED_INTENT: "partial_complete"
EXPECTED_CONFIDENCE: "medium"
```

### Test 5.3
```typescript
INPUT: "Half gedaan"
EXPECTED_INTENT: "partial_complete"
EXPECTED_CONFIDENCE: "medium"
```

---

## SECTION 6 — PLANNING

### Test 6.1
```typescript
INPUT: "Plan morgen deep work"
EXPECTED_INTENT: "create_calendar_event"
EXPECTED_CONFIDENCE: "strong"
```

### Test 6.2
```typescript
INPUT: "Zet morgen om 9u deep work"
EXPECTED_INTENT: "create_calendar_event"
EXPECTED_CONFIDENCE: "strong"
```

### Test 6.3
```typescript
INPUT: "Ik wil morgen starten"
EXPECTED_INTENT: "planning + start (ambiguous)"
EXPECTED_CONFIDENCE: "split"
EXPECTED_BEHAVIOR: "clarification_required"
```

### Test 6.4
```typescript
INPUT: "Plan focus sessie om 18u"
EXPECTED_INTENT: "create_calendar_event"
EXPECTED_CONFIDENCE: "strong"
```

---

## SECTION 7 — STATUS

### Test 7.1
```typescript
INPUT: "Hoeveel XP heb ik?"
EXPECTED_INTENT: "ask_status"
```

### Test 7.2
```typescript
INPUT: "Wat is mijn level?"
EXPECTED_INTENT: "ask_status"
```

### Test 7.3
```typescript
INPUT: "Hoeveel dagen streak?"
EXPECTED_INTENT: "ask_status"
```

### Test 7.4
```typescript
INPUT: "Hoeveel energie heb ik?"
EXPECTED_INTENT: "ask_status"
```

---

## SECTION 8 — RESISTANCE

### Test 8.1
```typescript
INPUT: "Geen zin"
EXPECTED_INTENT: "resistance"
EXPECTED_CONFIDENCE: "strong"
```

### Test 8.2
```typescript
INPUT: "Later"
EXPECTED_INTENT: "resistance"
EXPECTED_CONFIDENCE: "medium"
```

### Test 8.3
```typescript
INPUT: "Ik stel uit"
EXPECTED_INTENT: "resistance"
EXPECTED_CONFIDENCE: "strong"
```

### Test 8.4
```typescript
INPUT: "Skip vandaag"
EXPECTED_INTENT: "resistance"
EXPECTED_CONFIDENCE: "strong"
```

---

## SECTION 9 — FATIGUE

### Test 9.1
```typescript
INPUT: "Ik ben moe"
EXPECTED_INTENT: "fatigue_signal"
EXPECTED_SIGNALS: { fatigue: true }
```

### Test 9.2
```typescript
INPUT: "Geen energie"
EXPECTED_INTENT: "fatigue_signal"
EXPECTED_SIGNALS: { fatigue: true }
```

### Test 9.3
```typescript
INPUT: "Ik ben kapot"
EXPECTED_INTENT: "fatigue_signal"
EXPECTED_SIGNALS: { fatigue: true }
```

---

## SECTION 10 — DOUBT

### Test 10.1
```typescript
INPUT: "Misschien start ik"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "reduced"
EXPECTED_SIGNALS: { doubt: true }
```

### Test 10.2
```typescript
INPUT: "Ik twijfel"
EXPECTED_INTENT: "doubt_signal"
EXPECTED_SIGNALS: { doubt: true }
```

### Test 10.3
```typescript
INPUT: "Ik weet het niet"
EXPECTED_INTENT: "doubt_signal"
EXPECTED_SIGNALS: { doubt: true }
```

---

## SECTION 11 — MULTI INTENT

### Test 11.1
```typescript
INPUT: "Plan morgen deep work en start missie"
EXPECTED_INTENT: "split"
EXPECTED_ACTIONS: [
  { type: "create_calendar_event", priority: 1 },
  { type: "start_mission", priority: 2 }
]
EXPECTED_BEHAVIOR: "separate_confirmations"
```

### Test 11.2
```typescript
INPUT: "Start missie en check mijn XP"
EXPECTED_INTENT: "split"
EXPECTED_ACTIONS: [
  { type: "start_mission", priority: 1 },
  { type: "ask_status", priority: 2 }
]
```

### Test 11.3
```typescript
INPUT: "Plan morgen en annuleer huidige missie"
EXPECTED_INTENT: "split"
EXPECTED_ACTIONS: [
  { type: "create_calendar_event", priority: 1 },
  { type: "cancel_mission", priority: 2 }
]
```

---

## SECTION 12 — CONFLICT

### Test 12.1
```typescript
INPUT: "Ik ben klaar maar ik twijfel"
EXPECTED_INTENT: "complete_mission"
EXPECTED_CONFIDENCE: "reduced"
EXPECTED_BEHAVIOR: "confirmation_required"
EXPECTED_SIGNALS: { doubt: true }
```

### Test 12.2
```typescript
INPUT: "Ik wil starten maar niet nu"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarify"
```

### Test 12.3
```typescript
INPUT: "Plan morgen maar misschien niet"
EXPECTED_INTENT: "planning"
EXPECTED_CONFIDENCE: "reduced"
EXPECTED_SIGNALS: { doubt: true }
```

---

## SECTION 13 — STREAK RISK TRIGGERS

### Test 13.1
```typescript
INPUT: "Is mijn streak veilig?"
EXPECTED_INTENT: "ask_status"
EXPECTED_BEHAVIOR: "streak_risk_check"
```

### Test 13.2
```typescript
INPUT: "Breekt mijn streak?"
EXPECTED_INTENT: "streak_risk_check"
EXPECTED_BEHAVIOR: "calculate_risk"
```

---

## SECTION 14 — GOAL LANGUAGE

### Test 14.1
```typescript
INPUT: "Ik wil level 5 halen"
EXPECTED_INTENT: "goal_set"
```

### Test 14.2
```typescript
INPUT: "Ik wil beter worden"
EXPECTED_INTENT: "goal_set"
```

### Test 14.3
```typescript
INPUT: "Ik wil consistent zijn"
EXPECTED_INTENT: "goal_set"
```

---

## SECTION 15 — NOISE TOLERANCE

### Test 15.1
```typescript
INPUT: "Uh ik ga eh denk ik starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "reduced"
NOTES: noise filtering should extract core intent
```

### Test 15.2
```typescript
INPUT: "Dus ja misschien begin ik"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "reduced"
```

---

## SECTION 16 — URGENCY

### Test 16.1
```typescript
INPUT: "Start nu"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "boosted"
EXPECTED_SIGNALS: { urgency: true }
```

### Test 16.2
```typescript
INPUT: "Meteen beginnen"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "boosted"
EXPECTED_SIGNALS: { urgency: true }
```

---

## SECTION 17 — EXTREME EDGE CASES

### Test 17.1
```typescript
INPUT: "Ik ben klaar maar ook niet echt"
EXPECTED_INTENT: "complete_mission"
EXPECTED_CONFIDENCE: "very_low"
EXPECTED_BEHAVIOR: "clarification"
```

### Test 17.2
```typescript
INPUT: "Ik wil niet niet starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_BEHAVIOR: "double_negation_resolution"
NOTES: Double negation = positive
```

### Test 17.3
```typescript
INPUT: "Morgen misschien starten maar ook weer niet"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification"
```

---

## SECTION 18 — MORPHOLOGY STRESS TEST

### Test 18.1-18.14: Conjugation Variants

All should map to `start_mission` or `resistance` depending on negation:

```typescript
const conjugationTests = [
  { input: "Ik start", expected: "start_mission" },
  { input: "Wij starten", expected: "start_mission" },
  { input: "Ik startte", expected: "start_mission" },
  { input: "Ik ben gestart", expected: "start_mission" },
  { input: "Ik zal starten", expected: "start_mission" },
  { input: "Ik zou starten", expected: "start_mission" },
  { input: "Ik wilde starten", expected: "start_mission" },
  { input: "Ik moet starten", expected: "start_mission" },
  { input: "Ik moest starten", expected: "start_mission" },
  { input: "Ik kan starten", expected: "start_mission" },
  { input: "Ik kon starten", expected: "start_mission" },
  { input: "Niet starten", expected: "resistance" },
  { input: "Ik start niet", expected: "resistance" },
  { input: "Ik ben niet gestart", expected: "resistance" }
];
```

---

## SECTION 19 — RANDOM MIXED CASES (REAL WORLD)

### Test 19.1
```typescript
INPUT: "Ik denk dat ik morgen misschien wel kan beginnen"
EXPECTED_INTENT: "planning/start hybrid"
EXPECTED_CONFIDENCE: "medium-low"
EXPECTED_SIGNALS: { doubt: true }
```

### Test 19.2
```typescript
INPUT: "Ik heb geen zin maar mijn streak is 6 dagen"
EXPECTED_INTENT: "resistance"
EXPECTED_BEHAVIOR: "streak_pressure_suggestion"
EXPECTED_SIGNALS: { resistance: true }
```

### Test 19.3
```typescript
INPUT: "Deep work om 9 morgen en daarna starten"
EXPECTED_INTENT: "split"
EXPECTED_ACTIONS: [
  { type: "create_calendar_event", priority: 1 },
  { type: "start_mission", priority: 2 }
]
```

### Test 19.4
```typescript
INPUT: "Vandaag niet starten"
EXPECTED_INTENT: "resistance"
EXPECTED_CONFIDENCE: "strong"
```

### Test 19.5
```typescript
INPUT: "Morgen sowieso starten"
EXPECTED_INTENT: "planning + strong start"
EXPECTED_CONFIDENCE: "strong"
```

---

## SECTION 20 — PERFORMANCE BEHAVIOUR TRIGGERS

### Test 20.1
```typescript
INPUT: "Ik stel weer uit"
EXPECTED_INTENT: "resistance"
EXPECTED_BEHAVIOR: "resistance_escalation_check"
NOTES: "weer" indicates pattern repetition
```

### Test 20.2
```typescript
INPUT: "Dat ging slecht"
EXPECTED_INTENT: "performance_feedback"
EXPECTED_BEHAVIOR: "log_negative_feedback"
```

### Test 20.3
```typescript
INPUT: "Ik zat in flow"
EXPECTED_INTENT: "performance_boost"
EXPECTED_BEHAVIOR: "log_positive_feedback"
```

---

## Test Implementation Structure

### TypeScript Test Format

```typescript
interface TestCase {
  id: string;
  section: string;
  input: string;
  expectedIntent: Intent;
  expectedConfidence?: "strong" | "medium" | "low" | "reduced" | "very_low";
  expectedSignals?: Partial<DetectedSignals>;
  expectedActions?: ActionObject[];
  expectedBehavior?: string[];
  notes?: string;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
}
```

### Test Runner Structure

```typescript
describe("DCIC Language Engine", () => {
  describe("Section 1: Pure Start", () => {
    test.each(pureStartTests)("$id: $input", async (testCase) => {
      const result = await processInput(testCase.input);
      expect(result.intent).toBe(testCase.expectedIntent);
      expect(result.confidence).toBe(testCase.expectedConfidence);
    });
  });
  
  // ... other sections
});
```

---

## Expansion Guidelines

For realistic expansion:
- **200-300 variants per category**: Generate via morphology engine
- **Random noise injection**: Test robustness
- **Double negation tests**: Edge case handling
- **Time format variations**: "9u", "09:00", "om 9", etc.
- **Sarcasm detection**: Optional advanced feature

---

## END OF TEST SUITE