/**
 * Tutorial step definition. targetSelector is a CSS selector (e.g. [data-tutorial="brain-status-card"]).
 */
export type TutorialStep = {
  id: string;
  /** Route where this step is shown; if current pathname differs, we show "Let's go to X" and navigate on Next. */
  route?: string;
  /** Selector for the element to highlight; optional for transition-only steps. */
  targetSelector?: string;
  /** If set, when the app reports this action (e.g. brain-status-save), the step auto-advances. */
  actionId?: string;
  title: string;
  body: string;
};
