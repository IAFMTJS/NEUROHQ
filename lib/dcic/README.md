# Dark Commander Intelligence Core (DCIC)

## Overview

DCIC is a deterministic, domain-specific intelligence engine for mission management. It follows a strict pipeline:

**User Input → Validate → Simulate → Confirm → Execute**

## Architecture

### Core Components

1. **Types** (`types.ts`)
   - `GameState`: Gameplay state (level, XP, missions, streak)
   - `AssistantState`: Conversation state (intents, signals, patterns)
   - `ActionObject`: Action representation with simulation
   - `SimulationResult`: Preview of consequences

2. **State Gatekeeper** (`state-gatekeeper.ts`)
   - Pre-execution validation
   - Ensures actions are safe to execute
   - Checks energy, active missions, etc.

3. **Simulation Engine** (`simulation.ts`)
   - Previews consequences before execution
   - Calculates XP gain, level up, streak, achievements
   - Never mutates state

4. **Action Builder** (`action-builder.ts`)
   - Creates Action Objects from intents
   - Adds simulation data
   - Sets priority and confirmation requirements

5. **Execution Core** (`execution-core.ts`)
   - **ONLY** place where gameState mutates
   - Executes validated actions
   - Updates XP, level, streak, achievements

## Usage

### Starting a Mission

```typescript
import { startMission, confirmStartMission } from "@/app/actions/dcic/missions";

// Step 1: Get simulation
const result = await startMission(missionId);
if (result.success && result.simulation) {
  // Show confirmation modal with simulation
}

// Step 2: User confirms
await confirmStartMission(missionId);
```

### Completing a Mission

```typescript
import { completeMission, confirmCompleteMission } from "@/app/actions/dcic/missions";

// Step 1: Get simulation
const result = await completeMission(missionId);
if (result.success && result.simulation) {
  // Show confirmation modal with XP gain, level up, etc.
}

// Step 2: User confirms
await confirmCompleteMission(missionId);
```

### Using Confirmation Modal

```tsx
import { MissionConfirmationModal } from "@/components/dcic/MissionConfirmationModal";

<MissionConfirmationModal
  open={showModal}
  onClose={() => setShowModal(false)}
  missionId={missionId}
  missionName="Deep Work"
  actionType="complete"
  simulation={simulationResult}
/>
```

## Safety Rules

1. **No action below 0.6 confidence** → clarification required
2. **All persistent actions require confirmation** → no auto-execution
3. **All actions must be simulated before execution** → preview consequences
4. **Only Execution Core may mutate gameState** → strict boundary
5. **assistantState never mutates gameplay directly** → separation of concerns

## File Structure

```
lib/dcic/
  ├── types.ts              # Type definitions
  ├── state-gatekeeper.ts    # Pre-execution validation
  ├── simulation.ts          # Consequence simulation
  ├── action-builder.ts      # Action Object creation
  ├── execution-core.ts      # State mutations (ONLY HERE)
  └── index.ts              # Public API exports

app/actions/dcic/
  ├── game-state.ts         # GameState CRUD operations
  └── missions.ts           # Mission management actions

components/dcic/
  └── MissionConfirmationModal.tsx  # Confirmation UI
```

## Next Steps

- [ ] Integrate with existing assistant API
- [ ] Add behavior intelligence metrics
- [ ] Implement morphology engine (if needed)
- [ ] Add proactive triggers
- [ ] Create database schema for missions

## Testing

See `docs/DCIC_TEST_SUITE.md` and `docs/DCIC_CHAOS_TEST_SUITE.md` for comprehensive test cases.
