# Dark Commander Language Engine - Chaos Test Suite v1.0

## Purpose

**Designed to break weak deterministic systems.**

These are intentionally messy, ambiguous, semi-logical, realistic human sentences.

**If your engine survives this without executing weird actions → it's getting serious.**

---

## Test Format

Each test contains:
- `INPUT`: Messy, ambiguous, real-world human input
- `EXPECTED`: Expected intent or behavior
- `EXPECTED_CONFIDENCE`: Confidence level
- `EXPECTED_BEHAVIOR`: Required system behavior (clarification, conflict resolution, etc.)
- `CRITICAL_RULE`: What must NOT happen

---

## SECTION 1 — NOISE + MODAL + TIME MIX

### Test C1.1
```typescript
INPUT: "Uhm ik ga denk ik morgen misschien starten ofzo"
EXPECTED_INTENT: "start_mission" OR "planning"
EXPECTED_CONFIDENCE: "low-medium"
EXPECTED_BEHAVIOR: "clarification_required"
CRITICAL_RULE: "No action below confidence threshold"
```

### Test C1.2
```typescript
INPUT: "Dus ja ik moet eigenlijk wel beginnen denk ik"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "reduced"
EXPECTED_SIGNALS: { doubt: true }
```

### Test C1.3
```typescript
INPUT: "Ik wil morgen starten maar ik weet het niet"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
EXPECTED_SIGNALS: { doubt: true }
CRITICAL_RULE: "No execution on ambiguous intent"
```

### Test C1.4
```typescript
INPUT: "Morgen begin ik waarschijnlijk"
EXPECTED_INTENT: "planning/start hybrid"
EXPECTED_CONFIDENCE: "medium"
EXPECTED_SIGNALS: { doubt: true }
```

### Test C1.5
```typescript
INPUT: "Ik zou kunnen starten straks misschien"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "low"
EXPECTED_BEHAVIOR: "clarification_or_confirmation"
```

---

## SECTION 2 — DOUBLE NEGATION

### Test C2.1
```typescript
INPUT: "Ik wil niet niet starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_BEHAVIOR: "double_negation_resolution"
NOTES: Double negation = positive
```

### Test C2.2
```typescript
INPUT: "Ik ga niet niet beginnen"
EXPECTED_INTENT: "start_mission"
EXPECTED_BEHAVIOR: "double_negation_resolution"
```

### Test C2.3
```typescript
INPUT: "Ik ben niet niet klaar"
EXPECTED_INTENT: "complete_mission"
EXPECTED_BEHAVIOR: "double_negation_resolution"
```

### Test C2.4
```typescript
INPUT: "Ik wil niet geen focus"
EXPECTED_INTENT: "start_mission"
EXPECTED_BEHAVIOR: "double_negation_resolution"
```

---

## SECTION 3 — PARTIAL + CONTRADICTION

### Test C3.1
```typescript
INPUT: "Ik ben klaar maar eigenlijk ook niet"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
CRITICAL_RULE: "No completion without confirmation"
```

### Test C3.2
```typescript
INPUT: "Bijna klaar maar nog niet echt"
EXPECTED_INTENT: "partial_complete"
EXPECTED_CONFIDENCE: "medium"
```

### Test C3.3
```typescript
INPUT: "Klaar denk ik maar moe"
EXPECTED_INTENT: "complete_mission"
EXPECTED_CONFIDENCE: "reduced"
EXPECTED_SIGNALS: { fatigue: true }
EXPECTED_BEHAVIOR: "confirmation_required"
```

### Test C3.4
```typescript
INPUT: "Het zit erop of toch niet"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
```

---

## SECTION 4 — MULTI-INTENT CHAOS

### Test C4.1
```typescript
INPUT: "Plan morgen deep work en start missie maar check eerst mijn XP"
EXPECTED_INTENT: "split"
EXPECTED_ACTIONS: [
  { type: "create_calendar_event", priority: 1 },
  { type: "start_mission", priority: 2 },
  { type: "ask_status", priority: 3 }
]
EXPECTED_BEHAVIOR: "sequential_confirmation"
CRITICAL_RULE: "Each action requires separate confirmation"
```

### Test C4.2
```typescript
INPUT: "Start missie en annuleer morgen planning"
EXPECTED_INTENT: "split"
EXPECTED_ACTIONS: [
  { type: "start_mission", priority: 1 },
  { type: "cancel_calendar_event", priority: 2 }
]
```

### Test C4.3
```typescript
INPUT: "Plan morgen en misschien ook starten"
EXPECTED_INTENT: "split"
EXPECTED_ACTIONS: [
  { type: "create_calendar_event", priority: 1, confidence: "strong" },
  { type: "start_mission", priority: 2, confidence: "low" }
]
EXPECTED_BEHAVIOR: "clarification_for_low_confidence_action"
```

### Test C4.4
```typescript
INPUT: "Ik wil starten en niet starten tegelijk"
EXPECTED_INTENT: "conflict"
EXPECTED_BEHAVIOR: "conflict_resolution"
CRITICAL_RULE: "No execution on conflict - clarification required"
```

---

## SECTION 5 — TIME CONFUSION

### Test C5.1
```typescript
INPUT: "Start morgen vandaag"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "time_conflict_resolution"
CRITICAL_RULE: "No action with conflicting time references"
```

### Test C5.2
```typescript
INPUT: "Morgen om 9 vandaag beginnen"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
```

### Test C5.3
```typescript
INPUT: "Om 9 morgen of 10 misschien"
EXPECTED_INTENT: "create_calendar_event"
EXPECTED_CONFIDENCE: "reduced"
EXPECTED_BEHAVIOR: "clarification_for_time"
```

### Test C5.4
```typescript
INPUT: "Vanavond morgen starten"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
```

---

## SECTION 6 — RESISTANCE WITH GOAL PRESSURE

### Test C6.1
```typescript
INPUT: "Geen zin maar mijn streak is belangrijk"
EXPECTED_INTENT: "resistance"
EXPECTED_SIGNALS: { resistance: true }
EXPECTED_BEHAVIOR: "streak_pressure_suggestion"
NOTES: System should suggest maintaining streak despite resistance
```

### Test C6.2
```typescript
INPUT: "Ik stel uit maar ik wil level 5 halen"
EXPECTED_INTENT: "resistance"
EXPECTED_SIGNALS: { resistance: true }
EXPECTED_BEHAVIOR: "goal_pressure_suggestion"
```

### Test C6.3
```typescript
INPUT: "Ik ben moe maar ik moet starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_SIGNALS: { fatigue: true }
EXPECTED_CONFIDENCE: "reduced"
EXPECTED_BEHAVIOR: "confirmation_required"
```

### Test C6.4
```typescript
INPUT: "Ik wil niet starten maar ik moet"
EXPECTED_INTENT: "conflict"
EXPECTED_SIGNALS: { resistance: true }
EXPECTED_BEHAVIOR: "conflict_resolution"
```

---

## SECTION 7 — RANDOM STRUCTURE BREAKERS

### Test C7.1
```typescript
INPUT: "Morgen deep work ja misschien of nee"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
```

### Test C7.2
```typescript
INPUT: "Eh focus eh ja beginnen denk ik"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "low"
EXPECTED_BEHAVIOR: "noise_filtering + clarification"
```

### Test C7.3
```typescript
INPUT: "Ugh geen zin maar ok start"
EXPECTED_INTENT: "start_mission"
EXPECTED_SIGNALS: { resistance: true }
EXPECTED_BEHAVIOR: "resistance_override_detection"
NOTES: User overrides own resistance
```

### Test C7.4
```typescript
INPUT: "Ja nee misschien starten"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
```

### Test C7.5
```typescript
INPUT: "Start of niet starten dat is de vraag"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
CRITICAL_RULE: "No action on philosophical questions"
```

---

## SECTION 8 — SARCASTIC / META

### Test C8.1
```typescript
INPUT: "Ja hoor laten we vooral starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "medium"
NOTES: No sarcasm detection required - treat as literal
```

### Test C8.2
```typescript
INPUT: "Fantastisch weer starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "medium"
```

### Test C8.3
```typescript
INPUT: "Weer starten zeker"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "medium"
```

---

## SECTION 9 — EXTREME MORPHOLOGY STRESS

### Test C9.1
```typescript
INPUT: "Ik zou gestart kunnen zijn"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "low"
EXPECTED_BEHAVIOR: "past_reference_detection"
```

### Test C9.2
```typescript
INPUT: "Ik had moeten starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "low"
EXPECTED_BEHAVIOR: "past_reference_detection"
NOTES: Past conditional - reflection, not action request
```

### Test C9.3
```typescript
INPUT: "Ik had niet moeten starten"
EXPECTED_INTENT: "resistance"
EXPECTED_CONFIDENCE: "low"
EXPECTED_BEHAVIOR: "past_reference_reflection"
```

### Test C9.4
```typescript
INPUT: "Ik ben gestart maar niet echt begonnen"
EXPECTED_INTENT: "conflict"
EXPECTED_BEHAVIOR: "clarification_required"
```

---

## SECTION 10 — EDGE TIME STRUCTURES

### Test C10.1
```typescript
INPUT: "Start om negen of tien morgen ofzo"
EXPECTED_INTENT: "create_calendar_event"
EXPECTED_CONFIDENCE: "reduced"
EXPECTED_BEHAVIOR: "clarification_for_time"
```

### Test C10.2
```typescript
INPUT: "Misschien om 9u maar misschien ook niet"
EXPECTED_INTENT: "create_calendar_event"
EXPECTED_CONFIDENCE: "low"
EXPECTED_BEHAVIOR: "clarification_required"
```

### Test C10.3
```typescript
INPUT: "Zet deep work morgen maar niet zeker"
EXPECTED_INTENT: "create_calendar_event"
EXPECTED_CONFIDENCE: "reduced"
EXPECTED_SIGNALS: { doubt: true }
```

---

## SECTION 11 — PERFORMANCE CHAOS

### Test C11.1
```typescript
INPUT: "Dat ging slecht maar ik start weer"
EXPECTED_INTENT: "start_mission"
EXPECTED_BEHAVIOR: "performance_feedback_logging"
NOTES: Log negative feedback, proceed with start
```

### Test C11.2
```typescript
INPUT: "Ik zat in flow dus misschien niet stoppen"
EXPECTED_INTENT: "no_stop_intent"
EXPECTED_BEHAVIOR: "performance_boost_logging"
NOTES: Log positive feedback, no action needed
```

### Test C11.3
```typescript
INPUT: "Ik crashte maar start opnieuw"
EXPECTED_INTENT: "start_mission"
EXPECTED_SIGNALS: { fatigue: true }
EXPECTED_BEHAVIOR: "restart_detection"
```

---

## SECTION 12 — NEGATION OVERLOAD

### Test C12.1
```typescript
INPUT: "Ik wil niet niet niet starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_BEHAVIOR: "triple_negation_resolution"
NOTES: Odd number of negations = negative, even = positive
```

### Test C12.2
```typescript
INPUT: "Niet niet beginnen"
EXPECTED_INTENT: "start_mission"
EXPECTED_BEHAVIOR: "double_negation_resolution"
```

### Test C12.3
```typescript
INPUT: "Ik ben niet niet niet klaar"
EXPECTED_INTENT: "complete_mission"
EXPECTED_BEHAVIOR: "triple_negation_resolution"
```

---

## SECTION 13 — RANDOM REAL HUMAN

### Test C13.1
```typescript
INPUT: "Ok dus morgen deep work en dan zien we wel"
EXPECTED_INTENT: "create_calendar_event"
EXPECTED_CONFIDENCE: "medium"
EXPECTED_BEHAVIOR: "noise_filtering"
```

### Test C13.2
```typescript
INPUT: "Ik denk morgen beginnen tenzij moe"
EXPECTED_INTENT: "conditional_start"
EXPECTED_CONFIDENCE: "low"
EXPECTED_BEHAVIOR: "clarification_or_confirmation"
```

### Test C13.3
```typescript
INPUT: "Beginnen of misschien eerst plannen"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
```

### Test C13.4
```typescript
INPUT: "Ik wil starten maar ook weer niet echt"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
```

---

## SECTION 14 — INTENT DRIFT

### Test C14.1
```typescript
INPUT: "Hoeveel XP heb ik en misschien starten"
EXPECTED_INTENT: "split"
EXPECTED_ACTIONS: [
  { type: "ask_status", priority: 1, confidence: "strong" },
  { type: "start_mission", priority: 2, confidence: "low" }
]
EXPECTED_BEHAVIOR: "execute_status_query + clarify_start"
```

### Test C14.2
```typescript
INPUT: "Check mijn level en stop missie"
EXPECTED_INTENT: "split"
EXPECTED_ACTIONS: [
  { type: "ask_status", priority: 1 },
  { type: "cancel_mission", priority: 2 }
]
EXPECTED_BEHAVIOR: "sequential_confirmation"
```

### Test C14.3
```typescript
INPUT: "Wat is mijn streak en start daarna"
EXPECTED_INTENT: "split"
EXPECTED_ACTIONS: [
  { type: "ask_status", priority: 1 },
  { type: "start_mission", priority: 2 }
]
EXPECTED_BEHAVIOR: "execute_status + confirm_start"
```

---

## SECTION 15 — COMPLETE CHAOS MODE

### Test C15.1
```typescript
INPUT: "Ik eh morgen denk ik misschien starten maar ik weet niet want moe"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "very_low"
EXPECTED_SIGNALS: { doubt: true, fatigue: true }
EXPECTED_BEHAVIOR: "clarification_required"
CRITICAL_RULE: "No action below confidence threshold"
```

### Test C15.2
```typescript
INPUT: "Plan morgen of start of nee laat maar"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
CRITICAL_RULE: "No action on self-contradictory input"
```

### Test C15.3
```typescript
INPUT: "Ja maar nee maar misschien wel starten"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
```

### Test C15.4
```typescript
INPUT: "Ik wil eigenlijk niet maar toch misschien starten"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "very_low"
EXPECTED_SIGNALS: { resistance: true, doubt: true }
EXPECTED_BEHAVIOR: "confirmation_required"
```

### Test C15.5
```typescript
INPUT: "Start en stop tegelijk"
EXPECTED_INTENT: "conflict"
EXPECTED_BEHAVIOR: "conflict_resolution"
CRITICAL_RULE: "No execution on conflict"
```

---

## SECTION 16 — EDGE CONFIRMATION TEST

### Test C16.1
```typescript
INPUT: "Ja"
EXPECTED_INTENT: "confirm_action"
EXPECTED_BEHAVIOR: "confirm_only_if_pendingAction_exists"
CRITICAL_RULE: "No confirmation without pending action"
```

### Test C16.2
```typescript
INPUT: "Nee"
EXPECTED_INTENT: "cancel_action"
EXPECTED_BEHAVIOR: "cancel_pending_action"
```

### Test C16.3
```typescript
INPUT: "Doe maar"
EXPECTED_INTENT: "confirm_action"
EXPECTED_BEHAVIOR: "confirm_positive"
```

### Test C16.4
```typescript
INPUT: "Laat maar"
EXPECTED_INTENT: "cancel_action"
EXPECTED_BEHAVIOR: "confirm_negative"
```

---

## SECTION 17 — STREAK PANIC

### Test C17.1
```typescript
INPUT: "Gaat mijn streak breken als ik niet start?"
EXPECTED_INTENT: "streak_risk_check"
EXPECTED_BEHAVIOR: "calculate_streak_risk + provide_answer"
```

### Test C17.2
```typescript
INPUT: "Ik wil mijn streak niet verliezen"
EXPECTED_INTENT: "goal_set"
EXPECTED_BEHAVIOR: "streak_preservation_goal"
```

### Test C17.3
```typescript
INPUT: "Nog één dag voor streak 7"
EXPECTED_INTENT: "milestone_detection"
EXPECTED_BEHAVIOR: "streak_milestone_recognition"
```

---

## SECTION 18 — GOAL ESCALATION

### Test C18.1
```typescript
INPUT: "Ik wil level 10 halen en starten"
EXPECTED_INTENT: "split"
EXPECTED_ACTIONS: [
  { type: "goal_set", priority: 1 },
  { type: "start_mission", priority: 2 }
]
```

### Test C18.2
```typescript
INPUT: "Hoe kom ik sneller hoger level?"
EXPECTED_INTENT: "advisory_intent"
EXPECTED_BEHAVIOR: "provide_leveling_advice"
```

---

## SECTION 19 — EXTREME RANDOM HUMAN

### Test C19.1
```typescript
INPUT: "Dus ja morgen of zo iets doen misschien beginnen"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "low"
EXPECTED_BEHAVIOR: "noise_filtering + clarification"
```

### Test C19.2
```typescript
INPUT: "Ik moet echt maar ik voel het niet"
EXPECTED_INTENT: "start_mission"
EXPECTED_CONFIDENCE: "reduced"
EXPECTED_SIGNALS: { fatigue: true }
EXPECTED_BEHAVIOR: "confirmation_required"
```

### Test C19.3
```typescript
INPUT: "Nou ja starten dan maar of niet"
EXPECTED_INTENT: "ambiguous"
EXPECTED_BEHAVIOR: "clarification_required"
```

---

## CRITICAL VALIDATION RULES

Your engine passes if it:

✅ **No wrong direct actions**: Never executes action that doesn't match user intent
✅ **No action below threshold**: Never executes below 0.6 confidence
✅ **Ambiguity handling**: Always asks clarification when ambiguous
✅ **Double negation resolution**: Correctly resolves "niet niet" = positive
✅ **Multi-intent splitting**: Correctly splits and handles separately
✅ **Resistance detection**: Detects resistance signals correctly
✅ **Simulation before confirm**: Always simulates before requesting confirmation
✅ **Conflict resolution**: Handles conflicts without execution
✅ **Noise tolerance**: Filters noise while preserving intent
✅ **Time conflict handling**: Resolves conflicting time references

---

## Test Implementation

```typescript
interface ChaosTestCase {
  id: string;
  section: string;
  input: string;
  expectedIntent: Intent | "ambiguous" | "conflict";
  expectedConfidence?: ConfidenceLevel;
  expectedSignals?: Partial<DetectedSignals>;
  expectedActions?: ActionObject[];
  expectedBehavior: string[];
  criticalRule?: string;
  notes?: string;
}

describe("DCIC Chaos Test Suite", () => {
  test.each(chaosTests)("$id: $input", async (testCase) => {
    const result = await processInput(testCase.input);
    
    // Validate no action executed if below threshold
    if (result.confidence < 0.6 && result.action) {
      throw new Error("Action executed below confidence threshold");
    }
    
    // Validate ambiguity handling
    if (testCase.expectedIntent === "ambiguous" && result.action) {
      throw new Error("Action executed on ambiguous intent");
    }
    
    // Validate expected behavior
    testCase.expectedBehavior.forEach(behavior => {
      expect(result.behaviors).toContain(behavior);
    });
    
    // ... other validations
  });
});
```

---

## END OF CHAOS TEST SUITE

**Total: 70+ chaos test cases**

These tests ensure your deterministic system handles real-world messy human input without breaking or executing unintended actions.