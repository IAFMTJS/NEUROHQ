# Knip report

## Unused files (48)

* app/actions/behavioral-notification-context.ts
* app/actions/budget-energy.ts
* app/actions/dcic/finance-xp.ts
* app/actions/feature-flags.ts
* app/actions/rollover.ts
* app/hooks/useDelayedLoading.ts
* cinematic-engine/src/engine/core/Camera.ts
* cinematic-engine/src/engine/core/DynamicResolution.ts
* cinematic-engine/src/engine/core/FrameResources.ts
* cinematic-engine/src/engine/core/GPUProfiler.ts
* cinematic-engine/src/engine/core/RenderGraph.ts
* cinematic-engine/src/engine/core/Renderer.ts
* cinematic-engine/src/engine/core/index.ts
* cinematic-engine/src/engine/core/types.ts
* cinematic-engine/src/engine/debug/DebugUI.ts
* cinematic-engine/src/engine/debug/ProfilerOverlay.ts
* cinematic-engine/src/engine/debug/index.ts
* cinematic-engine/src/engine/passes/BloomPass.ts
* cinematic-engine/src/engine/passes/RaymarchPillPass.ts
* cinematic-engine/src/engine/passes/ToneMapPass.ts
* cinematic-engine/src/engine/passes/index.ts
* cinematic-engine/src/engine/quality/QualityTiers.ts
* cinematic-engine/src/engine/quality/index.ts
* cinematic-engine/src/main.ts
* cinematic-engine/src/scene/BeginMissionScene.ts
* cinematic-engine/vite.config.ts
* components/LoadingScene.tsx
* components/OnboardingBanner.tsx
* components/Skeleton.tsx
* components/dashboard/HelpPageClient.tsx
* components/missions/MissionsSectionFallback.tsx
* components/missions/RefreshPageButton.tsx
* components/onboarding/index.ts
* lib/animations.ts
* lib/assistant/prompt-builder.ts
* lib/budget-dashboard-context.tsx
* lib/cognitive-investment.ts
* lib/daily-bootstrap.ts
* lib/dcic/finance-index.ts
* lib/dcic/index.ts
* lib/model-mapping.ts
* lib/news-updates.ts
* lib/social-simulation.ts
* public/sw.js
* scripts/extract-quotes.js
* scripts/help-shorten.js
* scripts/mission-pill-gradient-stops.js
* scripts/next-build.js

## Unused dependencies (4)

| Name                          | Location          | Severity |
| :---------------------------- | :---------------- | :------- |
| @fontsource/plus-jakarta-sans | package.json:29:6 | error    |
| @react-three/fiber            | package.json:31:6 | error    |
| @react-three/drei             | package.json:30:6 | error    |
| geist                         | package.json:38:6 | error    |

## Unused devDependencies (1)

| Name               | Location          | Severity |
| :----------------- | :---------------- | :------- |
| eslint-config-next | package.json:57:6 | error    |

## Unused exports (218)

| Name                                  | Location                                             | Severity |
| :------------------------------------ | :--------------------------------------------------- | :------- |
| fetchSecondary                        | components/providers/DashboardDataProvider.tsx:58:23 | error    |
| fetchCritical                         | components/providers/DashboardDataProvider.tsx:45:23 | error    |
| AddCalendarEventForm                  | components/dashboard/DashboardClientOnly.tsx:6:10    | error    |
| CommanderSkillTree                    | components/commander/CommanderSkillTree.tsx:17:17    | error    |
| useBootstrapRequired                  | components/providers/BootstrapProvider.tsx:19:17     | error    |
| useAppStateRequired                   | components/providers/AppStateProvider.tsx:31:17      | error    |
| AddMissionModal3                      | components/missions/AddMissionModal3.tsx:85:17       | error    |
| getActiveMission                      | app/actions/dcic/mission-management.ts:154:23        | error    |
| CommanderXPBar                        | components/commander/CommanderXPBar.tsx:10:17        | error    |
| savePendingXpNotification             | app/actions/pending-xp-notification.ts:51:23         | error    |
| createMissionFromTask                 | app/actions/dcic/mission-management.ts:15:23         | error    |
| createMission                         | app/actions/dcic/mission-management.ts:80:23         | error    |
| computeAndStoreWeeklyBudgetAdjustment | app/actions/weekly-budget-feedback.ts:67:23          | error    |
| QuickAddModal                         | components/missions/QuickAddModal.tsx:22:17          | error    |
| recordBudgetDisciplineMission         | app/actions/missions-performance.ts:839:23           | error    |
| getTasksSortedByUMS                   | app/actions/missions-performance.ts:727:23           | error    |
| getCalendarSlotFromMessage            | lib/assistant/action-extraction.ts:281:17            | error    |
| getInvestedFocusForMission            | app/actions/cognitive-investment.ts:48:23            | error    |
| clearInvestedFocusForDay              | app/actions/cognitive-investment.ts:67:23            | error    |
| parseAddCalendar                      | lib/assistant/action-extraction.ts:175:17            | error    |
| parseAddLearning                      | lib/assistant/action-extraction.ts:227:17            | error    |
| setInvestedFocus                      | app/actions/cognitive-investment.ts:23:23            | error    |
| parseAddExpense                       | lib/assistant/action-extraction.ts:137:17            | error    |
| getFinancialInsights                  | app/actions/dcic/finance-state.ts:395:23             | error    |
| deleteBudgetTarget                    | app/actions/dcic/finance-state.ts:480:23             | error    |
| updateIncomeSource                    | app/actions/dcic/income-sources.ts:72:23             | error    |
| saveFinanceState                      | app/actions/dcic/finance-state.ts:338:23             | error    |
| parseAddTask                          | lib/assistant/action-extraction.ts:89:17             | error    |
| getBehaviourLog                       | app/actions/dcic/behaviour-log.ts:47:23              | error    |
| getBaseTonesForTrigger                | lib/behavioral-notifications.ts:514:17               | error    |
| pickEscalatedMessage                  | lib/behavioral-notifications.ts:528:17               | error    |
| getAchievements                       | app/actions/dcic/achievements.ts:81:23               | error    |
| decidePriority                        | lib/behavioral-notifications.ts:479:17               | error    |
| MissionButton                         | components/hq/MissionButton.tsx:195:17               | error    |
| MESSAGE_POOL                          | lib/behavioral-notifications.ts:180:14               | error    |
| pickMessage                           | lib/behavioral-notifications.ts:470:17               | error    |
| pickTone                              | lib/behavioral-notifications.ts:136:17               | error    |
| hadZeroCompletionsYesterday           | app/actions/daily-obligation.ts:43:23                | error    |
| getCompletionsCountForDate            | app/actions/daily-obligation.ts:10:23                | error    |
| getGeneratedDailyMissions             | app/actions/dcic/game-state.ts:168:23                | error    |
| resetAutoMissionsForToday             | app/actions/master-missions.ts:510:23                | error    |
| evaluateProgressionRankUp             | app/actions/progression-rank.ts:90:23                | error    |
| ensureIdentityEngineRows              | app/actions/identity-engine.ts:160:23                | error    |
| updateEvolutionPhase                  | app/actions/identity-engine.ts:145:23                | error    |
| updateArchetype                       | app/actions/identity-engine.ts:130:23                | error    |
| recordMissedOpportunity               | app/actions/regret-mechanic.ts:46:23                 | error    |
| onCompletionSameType                  | app/actions/regret-mechanic.ts:73:23                 | error    |
| computeOverloadRisk                   | lib/cognitive-load-forecast.ts:28:17                 | error    |
| getPersistedPayday                    | lib/client-persisted-payday.ts:42:17                 | error    |
| HQStatusRing                          | components/hq/HQStatusRing.tsx:14:17                 | error    |
| setRestDay                            | app/actions/recovery-engine.ts:57:23                 | error    |
| isRestDay                             | app/actions/recovery-engine.ts:77:23                 | error    |
| computeAndUpsertIdentityDrift         | app/actions/identity-drift.ts:61:23                  | error    |
| updateDifficultyFromLevel             | lib/dcic/difficulty-engine.ts:66:17                  | error    |
| getExcessActiveLoadBump               | app/actions/decision-cost.ts:137:23                  | error    |
| getChaosCountThisWeek                 | app/actions/chaos-scarcity.ts:23:23                  | error    |
| getScarcityCountToday                 | app/actions/chaos-scarcity.ts:53:23                  | error    |
| getActiveStartedCount                 | app/actions/decision-cost.ts:101:23                  | error    |
| getAlignmentForDate                   | app/actions/strategyFocus.ts:317:23                  | error    |
| getAchievementName                    | lib/dcic/achievement-utils.ts:19:17                  | error    |
| getXPByDomain                         | app/actions/strategyFocus.ts:257:23                  | error    |
| HQBackground                          | components/hq/HQBackground.tsx:7:17                  | error    |
| applyHeavyStartFocusCost              | app/actions/decision-cost.ts:68:23                   | error    |
| RecoveryCampaignBanner                | components/missions/index.ts:11:10                   | error    |
| ResistanceIndexBanner                 | components/missions/index.ts:10:10                   | error    |
| hasUnsyncedDailyState                 | lib/client-pending-writes.ts:39:17                   | error    |
| MetaInsights30Banner                  | components/missions/index.ts:13:10                   | error    |
| CommanderSkillTree                    | components/commander/index.ts:4:10                   | error    |
| CalendarViewShell                     | components/missions/index.ts:15:10                   | error    |
| CommanderStatRing                     | components/commander/index.ts:1:10                   | error    |
| applyAbandonCost                      | app/actions/decision-cost.ts:18:23                   | error    |
| HighROISection                        | components/missions/index.ts:12:10                   | error    |
| CommanderXPBar                        | components/commander/index.ts:5:10                   | error    |
| WatNuBlock                            | components/hq/WatNuBlock.tsx:12:17                   | error    |
| computeAndStorePrimeWindow            | app/actions/prime-window.ts:12:23                    | error    |
| simulateGoalAcceleration              | lib/dcic/finance-engine.ts:368:17                    | error    |
| getCategoryPercentages                | lib/dcic/finance-engine.ts:143:17                    | error    |
| calculateMonthsToGoal                 | lib/dcic/finance-engine.ts:356:17                    | error    |
| getRecurringExpenses                  | lib/dcic/finance-engine.ts:544:17                    | error    |
| getCategoryTotals                     | lib/dcic/finance-engine.ts:128:17                    | error    |
| AddMissionModal3                      | components/missions/index.ts:7:10                    | error    |
| getFlexiblePot                        | lib/dcic/finance-engine.ts:641:17                    | error    |
| CalendarModal3                        | components/missions/index.ts:8:10                    | error    |
| QuickAddModal                         | components/missions/index.ts:6:10                    | error    |
| getReEngagementPushPayload            | lib/re-engagement-copy.ts:164:17                     | error    |
| getReEngagementEmailBody              | lib/re-engagement-copy.ts:118:17                     | error    |
| buildConfirmationAction               | lib/dcic/action-builder.ts:92:17                     | error    |
| getDailyStateUncached                 | app/actions/daily-state.ts:59:23                     | error    |
| computeAllowHeavyNow                  | lib/client-today-engine.ts:62:17                     | error    |
| increaseTrait                         | lib/dcic/identity-engine.ts:5:17                     | error    |
| unlockSkill                           | app/actions/dcic/skills.ts:24:23                     | error    |
| getSkills                             | app/actions/dcic/skills.ts:59:23                     | error    |
| HQButton                              | components/hq/HQButton.tsx:17:17                     | error    |
| getReEngagementPushPayloadForScenario | lib/re-engagement-copy.ts:58:17                      | error    |
| getReEngagementEmailSubject           | lib/re-engagement-copy.ts:99:17                      | error    |
| pickReEngagementScenario              | lib/re-engagement-copy.ts:40:17                      | error    |
| getAutopilotDayPlan                   | app/actions/autopilot.ts:101:23                      | error    |
| baseXpForLevel                        | lib/mission-templates.ts:679:17                      | error    |
| subtractDays                          | lib/utils/budget-date.ts:126:17                      | error    |
| Constants                             | types/database.types.ts:3274:14                      | error    |
| getOrCreateCalendarFeedToken          | app/actions/calendar.ts:125:23                       | error    |
| copyStrategyFromLastQuarter           | app/actions/strategy.ts:190:23                       | error    |
| setMonthlyBookReadingGoal             | app/actions/learning.ts:494:23                       | error    |
| syncGoogleCalendarForDate             | app/actions/calendar.ts:170:23                       | error    |
| updateBookSelectionStatus             | app/actions/behavior.ts:147:23                       | error    |
| unarchiveEducationOption              | app/actions/learning.ts:373:23                       | error    |
| getTotalLearningMinutes               | app/actions/learning.ts:119:23                       | error    |
| filterAvailableMissions               | lib/dcic/mode-engine.ts:212:17                       | error    |
| archiveEducationOption                | app/actions/learning.ts:360:23                       | error    |
| getMonthlyBooksHistory                | app/actions/learning.ts:432:23                       | error    |
| recordAutopilotRefusal                | app/actions/autopilot.ts:67:23                       | error    |
| updateLearningSession                 | app/actions/learning.ts:219:23                       | error    |
| deleteLearningSession                 | app/actions/learning.ts:242:23                       | error    |
| updateEducationOption                 | app/actions/learning.ts:341:23                       | error    |
| deleteEducationOption                 | app/actions/learning.ts:386:23                       | error    |
| updateStrategyKrCheck                 | app/actions/strategy.ts:168:23                       | error    |
| completeMonthlyBook                   | app/actions/learning.ts:516:23                       | error    |
| getStrategyCheckIn                    | app/actions/strategy.ts:135:23                       | error    |
| setStrategyCheckIn                    | app/actions/strategy.ts:148:23                       | error    |
| createAutopilotDay                    | app/actions/autopilot.ts:79:23                       | error    |
| isRecoveryMission                     | lib/dcic/mode-engine.ts:243:17                       | error    |
| formatIsoTimeHms                      | lib/utils/date-locale.ts:31:17                       | error    |
| checkInactivity                       | app/actions/behavior.ts:107:23                       | error    |
| logMissedReason                       | app/actions/behavior.ts:161:23                       | error    |
| updateStudyPlan                       | app/actions/behavior.ts:224:23                       | error    |
| updateWarStage                        | lib/dcic/mode-engine.ts:175:17                       | error    |
| applyPenaltyXP                        | app/actions/behavior.ts:289:23                       | error    |
| useFreezeToken                        | app/actions/behavior.ts:299:23                       | error    |
| getPastTopics                         | app/actions/learning.ts:131:23                       | error    |
| HELP_SECTIONS                         | content/help/sections.ts:20:14                       | error    |
| canSwitchMode                         | lib/dcic/mode-engine.ts:129:17                       | error    |
| getStudyPlan                          | app/actions/behavior.ts:181:23                       | error    |
| switchMode                            | lib/dcic/mode-engine.ts:143:17                       | error    |
| HQCard                                | components/hq/HQCard.tsx:13:17                       | error    |
| updateWeeklyLearningTarget            | app/actions/learning.ts:31:23                        | error    |
| getPastQuarterlyStrategies            | app/actions/strategy.ts:22:23                        | error    |
| exportLearningSessionsCSV             | app/actions/learning.ts:97:23                        | error    |
| getCalendarEventsForDate              | app/actions/calendar.ts:11:23                        | error    |
| getMonthlyLearningWeeks               | app/actions/learning.ts:75:23                        | error    |
| upsertQuarterlyStrategy               | app/actions/strategy.ts:38:23                        | error    |
| exportStrategyMarkdown                | app/actions/strategy.ts:83:23                        | error    |
| getStrategyKeyResults                 | app/actions/strategy.ts:73:23                        | error    |
| recordFrictionEvent                   | app/actions/friction.ts:64:23                        | error    |
| resetSkillsForUser                    | app/actions/learning.ts:23:23                        | error    |
| getTopicBreakdown                     | app/actions/learning.ts:62:23                        | error    |
| getBehaviorState                      | app/actions/behavior.ts:30:23                        | error    |
| UNLOCK_CRITERIA                       | lib/progression-rank.ts:29:14                        | error    |
| getSkillName                          | lib/dcic/skill-utils.ts:17:17                        | error    |
| rankOrder                             | lib/progression-rank.ts:10:17                        | error    |
| HQNav                                 | components/hq/HQNav.tsx:16:17                        | error    |
| getEntriesReadyForFreezeReminder      | app/actions/budget.ts:560:23                         | error    |
| copyOldBudgetEntriesToArchive         | app/actions/budget.ts:360:23                         | error    |
| getFourWeekExpenseAverage             | app/actions/budget.ts:589:23                         | error    |
| AUTOPILOT_REFUSAL_LIMIT               | lib/autopilot-engine.ts:6:14                         | error    |
| PROGRESSION_RANK_ORDER                | lib/progression-rank.ts:8:14                         | error    |
| CAMPAIGN_THEME_LABELS                 | lib/identity-engine.ts:94:14                         | error    |
| addDisciplinePoints                   | app/actions/economy.ts:55:23                         | error    |
| addMomentumBoosters                   | app/actions/economy.ts:87:23                         | error    |
| RANK_XP_MULTIPLIER                    | lib/performance-rank.ts:8:14                         | error    |
| addFocusCredits                       | app/actions/economy.ts:71:23                         | error    |
| HQBackground                          | components/hq/index.ts:11:10                         | error    |
| HQStatusRing                          | components/hq/index.ts:15:10                         | error    |
| HQButton                              | components/hq/index.ts:13:10                         | error    |
| HQCard                                | components/hq/index.ts:14:10                         | error    |
| HQNav                                 | components/hq/index.ts:16:10                         | error    |
| getLocalDateTimeParts                 | lib/utils/timezone.ts:44:17                          | error    |
| PatternInsightCard                    | components/hq/index.ts:9:10                          | error    |
| calculateMomentum                     | lib/insight-engine.ts:27:17                          | error    |
| BrainStatusModal                      | components/hq/index.ts:4:10                          | error    |
| formatCentsValue                      | lib/utils/currency.ts:24:17                          | error    |
| getRoutineTasks                       | app/actions/tasks.ts:725:23                          | error    |
| HQShortcutGrid                        | components/hq/index.ts:8:10                          | error    |
| MissionButton                         | components/hq/index.ts:5:10                          | error    |
| clarityScore                          | lib/utils/learning.ts:14:17                          | error    |
| parseToCents                          | lib/utils/currency.ts:29:17                          | error    |
| getSubtasks                           | app/actions/tasks.ts:637:23                          | error    |
| WatNuBlock                            | components/hq/index.ts:7:10                          | error    |
| CHAOS_FAIL_LOAD_PENALTY               | lib/chaos-scarcity.ts:7:14                           | error    |
| CHAOS_XP_MULTIPLIER                   | lib/chaos-scarcity.ts:6:14                           | error    |
| loadDailySnapshot                     | lib/client-cache.ts:131:17                           | error    |
| saveUiPreference                      | lib/client-cache.ts:104:17                           | error    |
| loadUiPreference                      | lib/client-cache.ts:114:17                           | error    |
| getNextQuarter                        | lib/utils/strategy.ts:8:17                           | error    |
| clearQueue                            | lib/offline-queue.ts:68:17                           | error    |
| COLOR_MODE_LABELS                     | lib/theme-tokens.ts:16:14                            | error    |
| getThemeDataAttrs                     | lib/theme-tokens.ts:21:17                            | error    |
| isRankPromotion                       | lib/rank-ladder.ts:103:17                            | error    |
| THEME_LABELS                          | lib/theme-tokens.ts:12:14                            | error    |
| COLOR_MODES                           | lib/theme-tokens.ts:10:14                            | error    |
| awardXPForWeeklyLearningTarget        | app/actions/xp.ts:239:23                             | error    |
| awardXPForStreakDay                   | app/actions/xp.ts:244:23                             | error    |
| getRankPerks                          | lib/rank-ladder.ts:90:17                             | error    |
| getNextRank                           | lib/rank-ladder.ts:95:17                             | error    |
| THEME_IDS                             | lib/theme-tokens.ts:9:14                             | error    |
| isEnergyAllowedForTier                | lib/brain-mode.ts:58:17                              | error    |
| shouldSuggestRecovery                 | lib/brain-mode.ts:36:17                              | error    |
| getEffectiveStress                    | lib/brain-mode.ts:31:17                              | error    |
| classifyIntensity                     | lib/brain-mode.ts:46:17                              | error    |
| getBrainModeLabel                     | lib/brain-mode.ts:70:17                              | error    |
| getHeadroomTier                       | lib/brain-mode.ts:15:17                              | error    |
| getBrainRisk                          | lib/brain-mode.ts:21:17                              | error    |
| INDUSTRIAL_THEME_BACKGROUND_PATH      | lib/emotions.ts:62:14                                | error    |
| GIRLY_THEME_BACKGROUND_PATH           | lib/emotions.ts:46:14                                | error    |
| EMOTION_2D_PATHS_INDUSTRIAL           | lib/emotions.ts:49:14                                | error    |
| EMOTION_2D_PATHS_GIRLY                | lib/emotions.ts:33:14                                | error    |
| getEmotionImagePath                   | lib/emotions.ts:65:17                                | error    |
| EMOTION_ACCENT_HSL                    | lib/emotions.ts:70:14                                | error    |
| EMOTION_2D_PATHS                      | lib/emotions.ts:20:14                                | error    |
| EMOTION_LABELS                        | lib/emotions.ts:82:14                                | error    |
| EMOTION_KEYS                          | lib/emotions.ts:94:14                                | error    |
| MASCOT_FILE_BY_PAGE                   | lib/mascots.ts:23:14                                 | error    |
| MASCOT_STATE_FILE                     | lib/mascots.ts:45:14                                 | error    |
| pageFromPathname                      | lib/mascots.ts:85:17                                 | error    |
| UI_STATES                             | lib/ui-state.ts:8:14                                 | error    |
| quoteIdForDay                         | lib/quotes.ts:20:17                                  | error    |
| getEmailForUser                       | lib/email.ts:13:23                                   | error    |
| sendAppEmail                          | lib/email.ts:51:23                                   | error    |
| MAX_LEVEL                             | lib/xp.ts:52:10                                      | error    |

