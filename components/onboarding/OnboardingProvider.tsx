"use client";

import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addRouteVisited,
  clearTutorialState,
  getTutorialState,
  getSetupReminderDismissed,
  getTutorialSkipped,
  getTipsSeen,
  markTipSeen as markTipSeenStorage,
  setTutorialCompleted,
  setTutorialMode,
  setTutorialSkipped,
  setTutorialStep,
  setSetupReminderDismissed,
  type TutorialMode,
} from "@/lib/onboarding-storage";
import { QUICK_TOUR_STEPS } from "@/content/onboarding/quick-tour-steps";
import { FULL_TOUR_STEPS } from "@/content/onboarding/full-tour-steps";
import type { TutorialStep } from "@/content/onboarding/types";
import { TutorialIntroModal } from "./TutorialIntroModal";
import { CoachMark } from "./CoachMark";
import { TransitionOverlay } from "./TransitionOverlay";

type OnboardingContextValue = {
  openIntroModal: () => void;
  restartTutorial: () => void;
  reportTutorialAction: (actionId: string) => void;
  isTipSeen: (tipId: string) => boolean;
  markTipSeen: (tipId: string) => void;
  showSetupReminder: boolean;
  dismissSetupReminder: () => void;
};

const OnboardingContext = React.createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue | null {
  return useContext(OnboardingContext);
}

const STEPS_BY_MODE: Record<TutorialMode, TutorialStep[]> = {
  quick: QUICK_TOUR_STEPS,
  full: FULL_TOUR_STEPS,
};

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [introModalOpen, setIntroModalOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [mode, setMode] = useState<TutorialMode | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [actionCompletedForCurrentStep, setActionCompletedForCurrentStep] = useState(false);

  const steps = useMemo(() => (mode ? STEPS_BY_MODE[mode] : []), [mode]);
  const totalSteps = steps.length;
  const currentStep = totalSteps > 0 && stepIndex >= 0 && stepIndex < totalSteps ? steps[stepIndex]! : null;
  const needsNavigation =
    currentStep?.route != null && pathname !== currentStep.route;

  useEffect(() => {
    addRouteVisited(pathname);
    if (pathname === "/profile" && searchParams.get("view") === "insights") {
      addRouteVisited("/report");
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const state = getTutorialState();
    if (state.completed) {
      setIntroModalOpen(false);
      setTourActive(false);
      setMode(null);
      return;
    }
    if (state.mode) {
      setTourActive(true);
      setMode(state.mode);
      setStepIndex(state.step);
      setIntroModalOpen(false);
    } else {
      setIntroModalOpen(true);
      setTourActive(false);
    }
  }, []);

  const openIntroModal = useCallback(() => {
    setIntroModalOpen(true);
  }, []);

  const restartTutorial = useCallback(() => {
    clearTutorialState();
    setIntroModalOpen(true);
    setTourActive(false);
    setMode(null);
    setStepIndex(0);
  }, []);

  const handleQuickTour = useCallback(() => {
    setTutorialMode("quick");
    setTutorialStep(0);
    setMode("quick");
    setStepIndex(0);
    setTourActive(true);
  }, []);

  const handleFullTour = useCallback(() => {
    setTutorialMode("full");
    setTutorialStep(0);
    setMode("full");
    setStepIndex(0);
    setTourActive(true);
  }, []);

  const handleSkipTutorial = useCallback(() => {
    setTutorialSkipped();
    setIntroModalOpen(false);
    setTourActive(false);
    setMode(null);
    setShowSetupReminderState(true);
  }, []);

  const goNext = useCallback(() => {
    if (needsNavigation && currentStep?.route) {
      router.push(currentStep.route);
      return;
    }
    if (stepIndex >= totalSteps - 1) {
      setTutorialCompleted(); // finished tour, not skipped
      setTourActive(false);
      setMode(null);
      return;
    }
    const next = stepIndex + 1;
    setTutorialStep(next);
    setStepIndex(next);
  }, [needsNavigation, currentStep?.route, stepIndex, totalSteps, router]);

  const goBack = useCallback(() => {
    if (stepIndex <= 0) return;
    const prev = stepIndex - 1;
    setTutorialStep(prev);
    setStepIndex(prev);
  }, [stepIndex]);

  const skipTour = useCallback(() => {
    setTutorialSkipped();
    setTourActive(false);
    setMode(null);
    setShowSetupReminderState(true);
  }, []);

  useEffect(() => {
    setActionCompletedForCurrentStep(false);
  }, [stepIndex, currentStep?.id]);

  const reportTutorialAction = useCallback(
    (actionId: string) => {
      if (!tourActive || currentStep?.actionId !== actionId) return;
      if (currentStep.requireAction) {
        setActionCompletedForCurrentStep(true);
      } else {
        goNext();
      }
    },
    [tourActive, currentStep?.actionId, currentStep?.requireAction, goNext]
  );

  const [tipsSeenState, setTipsSeenState] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setTipsSeenState(getTipsSeen());
  }, []);
  const isTipSeen = useCallback((tipId: string) => tipsSeenState[tipId] === true, [tipsSeenState]);
  const markTipSeen = useCallback((tipId: string) => {
    markTipSeenStorage(tipId);
    setTipsSeenState((prev) => ({ ...prev, [tipId]: true }));
  }, []);

  const [showSetupReminderState, setShowSetupReminderState] = useState(false);
  useEffect(() => {
    const state = getTutorialState();
    const skipped = getTutorialSkipped();
    const dismissed = getSetupReminderDismissed();
    setShowSetupReminderState(state.completed && skipped && !dismissed);
  }, []);
  const dismissSetupReminder = useCallback(() => {
    setSetupReminderDismissed();
    setShowSetupReminderState(false);
  }, []);

  const contextValue = useMemo<OnboardingContextValue>(
    () => ({
      openIntroModal,
      restartTutorial,
      reportTutorialAction,
      isTipSeen,
      markTipSeen,
      showSetupReminder: showSetupReminderState,
      dismissSetupReminder,
    }),
    [openIntroModal, restartTutorial, reportTutorialAction, isTipSeen, markTipSeen, showSetupReminderState, dismissSetupReminder]
  );

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      {introModalOpen && (
        <TutorialIntroModal
          open={introModalOpen}
          onClose={() => setIntroModalOpen(false)}
          onQuickTour={handleQuickTour}
          onFullTour={handleFullTour}
          onSkip={handleSkipTutorial}
        />
      )}
      {tourActive && currentStep && needsNavigation && (
        <TransitionOverlay
          open
          route={currentStep.route!}
          onNext={goNext}
        />
      )}
      {tourActive && currentStep && !needsNavigation && (
        <CoachMark
          open
          title={currentStep.title}
          body={currentStep.body}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          targetSelector={currentStep.targetSelector}
          onBack={goBack}
          onNext={goNext}
          onSkip={skipTour}
          nextDisabled={
            !!(currentStep.requireAction && currentStep.actionId && !actionCompletedForCurrentStep)
          }
          requiredActionHint={currentStep.actionHint}
        />
      )}
    </OnboardingContext.Provider>
  );
}