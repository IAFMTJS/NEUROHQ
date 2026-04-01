/**
 * Behavior / adaptation — friction, adaptive UI, accountability, study plan.
 */
export { getFrictionSignals, recordFrictionEvent } from "@/app/actions/friction";
export { getAdaptiveSuggestions } from "@/app/actions/adaptive";
export {
  getAccountabilitySettings,
  getStudyPlan,
  getBehaviorState,
} from "@/app/actions/behavior";
export { getBehaviorProfile } from "@/app/actions/behavior-profile";
