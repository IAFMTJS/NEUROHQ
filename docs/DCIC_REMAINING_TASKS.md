# DCIC - Remaining Tasks & Next Steps

## ✅ **WAT IS AL KLAAR**

### Core Components
- ✅ Type definitions (GameState, Mission, AssistantState)
- ✅ State Gatekeeper (pre-execution validation)
- ✅ Simulation Engine (preview consequences)
- ✅ Action Builder (Action Object creation)
- ✅ Execution Core (state mutations)
- ✅ Confirmation UI (MissionConfirmationModal)
- ✅ Server Actions (game-state.ts, missions.ts)
- ✅ Intent Classifier (basic mission detection)
- ✅ Assistant Integration (bridge met API)
- ✅ API Route Integration

---

## 🔴 **KRITIEKE TAKEN (Moet eerst)**

### 1. Database Schema voor Missions
**Status**: ❌ Niet gebouwd  
**Prioriteit**: 🔴 HOOG

**Wat nodig is**:
- `missions` tabel in Supabase
- `mission_state` tabel voor active/completed tracking
- `behaviour_log` tabel voor pattern tracking
- `achievements` tabel voor achievement unlocks

**Actie**:
```sql
-- Create missions table
CREATE TABLE missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 100,
  energy_cost integer NOT NULL DEFAULT 15,
  difficulty_level numeric(3,2) NOT NULL DEFAULT 0.5,
  active boolean NOT NULL DEFAULT false,
  completed boolean NOT NULL DEFAULT false,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create mission_state table (tracks active mission per user)
CREATE TABLE mission_state (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  active_mission_id uuid REFERENCES missions(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create behaviour_log table
CREATE TABLE behaviour_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  mission_started_at timestamptz,
  mission_completed_at timestamptz,
  energy_before integer,
  energy_after integer,
  resisted_before_start boolean NOT NULL DEFAULT false,
  difficulty_level numeric(3,2),
  xp_gained integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);
```

**Bestand**: `supabase/migrations/021_dcic_missions.sql`

---

### 2. Fix GameState Mapping
**Status**: ⚠️ Gebruikt tasks als temporary mapping  
**Prioriteit**: 🔴 HOOG

**Probleem**: `getGameState()` gebruikt tasks tabel als temporary workaround

**Actie**:
- Update `getGameState()` om missions tabel te gebruiken
- Update `saveGameState()` om missions tabel te updaten
- Implementeer proper mission state tracking

**Bestand**: `app/actions/dcic/game-state.ts`

---

### 3. Streak Calculation
**Status**: ⚠️ Mock data  
**Prioriteit**: 🔴 HOOG

**Probleem**: Streak wordt niet correct berekend

**Actie**:
- Bereken streak uit `behaviour_log` of `missions` tabel
- Track `lastCompletionDate` correct
- Update streak logic in `execution-core.ts`

**Bestand**: `app/actions/dcic/game-state.ts`, `lib/dcic/execution-core.ts`

---

### 4. Behaviour Log Integration
**Status**: ❌ Niet geïmplementeerd  
**Prioriteit**: 🔴 HOOG

**Probleem**: `executeCompleteMission()` en `executeStartMission()` loggen niet naar database

**Actie**:
- Create `logBehaviourEntry()` functie
- Call na elke mission start/complete
- Store in `behaviour_log` tabel

**Bestand**: `app/actions/dcic/missions.ts`

---

## 🟡 **BELANGRIJKE TAKEN (Binnenkort)**

### 5. Mission ID Extraction
**Status**: ❌ TODO in code  
**Prioriteit**: 🟡 MEDIUM

**Probleem**: `extractMissionId()` returnt altijd null

**Actie**:
- Implementeer mission name matching
- Support mission ID in message
- Fallback naar active mission als geen ID gevonden

**Bestand**: `lib/dcic/intent-classifier.ts`

---

### 6. XP & Energy Calculation
**Status**: ⚠️ Hardcoded values  
**Prioriteit**: 🟡 MEDIUM

**Probleem**: 
- `xpReward` is hardcoded (100 + index * 20)
- `energyCost` is hardcoded (15)
- `difficultyLevel` is hardcoded (0.5)

**Actie**:
- Bereken XP op basis van task properties (priority, energy_required, etc.)
- Bereken energy cost op basis van task.energy_required
- Bereken difficulty op basis van task properties

**Bestand**: `app/actions/dcic/game-state.ts`

---

### 7. Active Mission Tracking
**Status**: ⚠️ Mock (index === 0)  
**Prioriteit**: 🟡 MEDIUM

**Probleem**: Active mission wordt niet correct getrackt

**Actie**:
- Gebruik `mission_state` tabel
- Update bij mission start
- Clear bij mission complete
- Check bij gameState load

**Bestand**: `app/actions/dcic/game-state.ts`, `app/actions/dcic/missions.ts`

---

### 8. Achievements System
**Status**: ❌ Niet geïmplementeerd  
**Prioriteit**: 🟡 MEDIUM

**Probleem**: Achievements worden niet opgeslagen

**Actie**:
- Create achievements table
- Implement `checkAchievements()` in execution-core
- Save achievements naar database
- Load achievements in getGameState

**Bestand**: `lib/dcic/execution-core.ts`, `app/actions/dcic/game-state.ts`

---

### 9. Skills System
**Status**: ❌ Niet geïmplementeerd  
**Prioriteit**: 🟡 MEDIUM

**Probleem**: Skills object is leeg

**Actie**:
- Define skills structure
- Implement skill unlocks
- Store in database (of user_preferences)

**Bestand**: `app/actions/dcic/game-state.ts`

---

## 🟢 **NICE TO HAVE (Later)**

### 10. Morphology Engine (Phase 2)
**Status**: ❌ Niet gebouwd  
**Prioriteit**: 🟢 LOW (alleen als nodig)

**Actie**:
- Build root library
- Implement variant generation
- Integrate met intent classifier

**Bestand**: `lib/dcic/morphology.ts`

---

### 11. Enhanced Intent Scoring
**Status**: ⚠️ Basic matching  
**Prioriteit**: 🟢 LOW

**Actie**:
- Implement weighted scoring
- Add confidence calculation
- Add ambiguity detection

**Bestand**: `lib/dcic/intent-scoring.ts`

---

### 12. Behaviour Intelligence Metrics
**Status**: ❌ Niet geïmplementeerd  
**Prioriteit**: 🟢 LOW

**Actie**:
- Calculate completion rate
- Calculate resistance rate
- Calculate energy efficiency
- Calculate performance score

**Bestand**: `lib/dcic/behaviour-intelligence.ts`

---

### 13. Proactive Triggers
**Status**: ❌ Niet geïmplementeerd  
**Prioriteit**: 🟢 LOW

**Actie**:
- Implement streak risk check
- Implement resistance trend detection
- Generate tactical suggestions

**Bestand**: `lib/dcic/proactive.ts`

---

### 14. Adaptive Difficulty
**Status**: ❌ Niet geïmplementeerd  
**Prioriteit**: 🟢 LOW

**Actie**:
- Track completion rate
- Adjust difficulty based on performance
- Update mission difficulty levels

**Bestand**: `lib/dcic/adaptive-difficulty.ts`

---

## 🧪 **TESTING**

### 15. Unit Tests
**Status**: ❌ Geen tests  
**Prioriteit**: 🟡 MEDIUM

**Actie**:
- Test State Gatekeeper
- Test Simulation Engine
- Test Execution Core
- Test Intent Classifier

**Bestand**: `lib/dcic/__tests__/`

---

### 16. Integration Tests
**Status**: ❌ Geen tests  
**Prioriteit**: 🟡 MEDIUM

**Actie**:
- Test full mission flow (start → complete)
- Test confirmation flow
- Test API integration

**Bestand**: `app/api/assistant/__tests__/`

---

### 17. Test Suite Implementation
**Status**: ❌ Test cases niet geïmplementeerd  
**Prioriteit**: 🟡 MEDIUM

**Actie**:
- Implement standard test suite (70+ cases)
- Implement chaos test suite (70+ cases)
- Run tests in CI/CD

**Bestand**: `lib/dcic/__tests__/test-suite.ts`

---

## 📋 **IMPLEMENTATIE VOLGORDE**

### Week 1: Database & Core Fixes
1. ✅ Create database schema (missions, mission_state, behaviour_log, achievements)
2. ✅ Fix getGameState() om missions tabel te gebruiken
3. ✅ Implement streak calculation
4. ✅ Implement behaviour log integration
5. ✅ Fix active mission tracking

### Week 2: Mission Management
6. ✅ Implement mission ID extraction
7. ✅ Fix XP & energy calculation
8. ✅ Implement achievements system
9. ✅ Basic testing

### Week 3: Intelligence Layer (optioneel)
10. ⏸️ Behaviour Intelligence metrics
11. ⏸️ Proactive Triggers
12. ⏸️ Adaptive Difficulty

### Week 4: Language Engine (optioneel)
13. ⏸️ Morphology Engine (alleen als nodig)
14. ⏸️ Enhanced Intent Scoring
15. ⏸️ Ambiguity Resolver

---

## 🚨 **BLOCKERS**

1. **Database Schema**: Zonder missions tabel werkt het systeem niet goed
2. **Streak Calculation**: Zonder correcte streak tracking werkt gamification niet
3. **Behaviour Log**: Zonder logging kunnen we geen patterns detecteren

---

## 📝 **NOTES**

- **Tasks vs Missions**: Momenteel gebruikt DCIC tasks als temporary mapping. Dit moet worden vervangen door een echte missions tabel.
- **Backward Compatibility**: Zorg dat bestaande tasks functionaliteit blijft werken.
- **Migration Path**: Plan hoe je van tasks naar missions migreert zonder data verlies.

---

## END OF REMAINING TASKS