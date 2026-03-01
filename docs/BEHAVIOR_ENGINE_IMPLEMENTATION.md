# Behavior Engine Implementation

## Overview

The Behavior Engine is a comprehensive system that transforms NEUROHQ from a simple gamification tool into a behavior architecture system. It tracks user patterns, intervenes when streaks break, adapts difficulty, and provides accountability mechanisms.

## Architecture

### 1. Database Schema (`020_behavior_engine.sql`)

- **user_behavior**: Core behavior tracking (inactivity, consistency, missed reasons)
- **study_plan**: Daily goals and preferred study times
- **accountability_settings**: Penalty XP and freeze tokens
- **weekly_reports**: Performance reports for reflection
- **behavior_patterns**: AI coach pattern detection

### 2. Server Actions (`app/actions/behavior.ts`)

Core functions:
- `getBehaviorState()`: Get or initialize behavior state
- `updateLastActiveDate()`: Track app usage
- `updateLastStudyDate()`: Track study sessions
- `checkInactivity()`: Detect inactivity (warns at 7+ days)
- `logMissedReason()`: Log why streak broke
- `getStudyPlan()` / `updateStudyPlan()`: Manage study schedule
- `getAccountabilitySettings()`: Get accountability config
- `applyPenaltyXP()`: Apply XP penalty for missed days
- `useFreezeToken()`: Use token to prevent streak loss
- `calculateWeeklyConsistency()`: Calculate weekly consistency %
- `detectBehaviorPatterns()`: Detect patterns for AI coach

### 3. Components

#### `InactivityWarning.tsx`
Shows warning when user hasn't studied for 7+ days. This is a "confrontation, not a notification."

#### `LearningPathLock.tsx`
Blocks Growth page if no monthly book is selected. Forces users to choose direction.

#### `FailureIntervention.tsx`
Modal shown when streak breaks. Asks user to reflect on why (no_time, no_energy, forgot, low_motivation).

#### `WeeklyReport.tsx`
Shown on Sundays. Displays:
- Total minutes
- Missions completed
- Streak status
- Rank progress

#### `FocusLockMode.tsx`
Fullscreen focus mode during study sessions. Disables navigation, shows timer, tracks energy drain.

#### `AICoach.tsx`
Shows detected behavior patterns with suggestions. Example: "Pattern detected: you skip after busy days. Try scheduling shorter 10-minute sessions."

#### `StudyPlanSettings.tsx`
Allows users to configure:
- Daily goal minutes
- Preferred study time
- Reminder enabled/disabled

#### `BehaviorEngine.tsx`
Main orchestrator component that:
- Checks inactivity on mount
- Shows failure intervention on streak break
- Shows weekly report on Sundays
- Updates book selection status
- Coordinates all behavior components

## Integration Points

### Growth Page (`app/(dashboard)/learning/page.tsx`)
- Added `BehaviorEngine` component
- Added `StudyPlanSettings` component
- Fetches behavior state and study plan

### Learning Session Creation (`app/actions/learning.ts`)
- Updates `lastStudyDate` when session is added
- Calculates weekly consistency
- Applies adaptive difficulty (reduces XP for sessions < 10 min)
- Detects behavior patterns

### App Layout (`app/(dashboard)/layout.tsx`)
- Updates `lastActiveDate` on app start

## Adaptive Difficulty

XP multipliers based on session length:
- < 10 minutes: 50% XP
- < 15 minutes: 75% XP
- ≥ 15 minutes: 100% XP

This encourages longer, more meaningful study sessions.

## Accountability Mode

When enabled:
- Missed day → -50 XP penalty (configurable)
- OR use freeze token to prevent streak loss
- Freeze tokens start at 1, can be earned/configured

## Weekly Consistency

Calculated as: (unique study days in week / 7) * 100

Stored in `user_behavior.weekly_consistency`.

## Pattern Detection

Currently detects:
- `missed_after_busy`: User skips after busy days (no_time reason repeated)

Suggests: "Try scheduling shorter 10-minute sessions."

## Future Enhancements

### PWA Push Notifications
Requires:
1. Service Worker registration
2. VAPID keys setup
3. Push subscription management
4. Backend notification service (Firebase Cloud Messaging recommended)

### Identity Building
- Rank badges display
- Rank-exclusive missions
- Rank-exclusive buffs

### Advanced AI Coach
- More pattern types
- Personalized suggestions based on history
- Integration with energy system

## Usage

The Behavior Engine runs automatically:
1. On app start: Updates last active date
2. On learning session: Updates last study date, calculates consistency, detects patterns
3. On Growth page load: Checks inactivity, shows warnings, displays reports
4. On streak break: Shows failure intervention modal

No manual configuration required - it works out of the box with sensible defaults.
