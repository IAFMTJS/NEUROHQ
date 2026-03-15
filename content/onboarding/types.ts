/**
 * Tutorial step definition. targetSelector is a CSS selector (e.g. [data-tutorial="brain-status-card"]).
 */
export type TutorialStep = {
  id: string;
  /** Route where this step is shown; if current pathname differs, we show "Let's go to X" and navigate on Next. */
  route?: string;
  /** Selector for the element to highlight; optional for transition-only steps. */
  targetSelector?: string;
  /** When set, the user must perform this action before Next is enabled. reportTutorialAction(actionId) marks it done. */
  actionId?: string;
  /** If true and actionId is set, Next stays disabled until the action is performed. Shown with actionHint. */
  requireAction?: boolean;
  /** Shown when requireAction is true and action not yet done (e.g. "Update your Brain Status above, then click Next."). */
  actionHint?: string;
  title: string;
  body: string;
};
