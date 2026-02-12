"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "neurohq_onboarding_step";

export function OnboardingBanner() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === "done") setStep(-1);
        else if (v !== null) {
          const n = parseInt(v, 10) || 0;
          setStep(n >= 2 ? 1 : n);
        } else setStep(0);
      }
    } catch {
      setStep(0);
    }
  }, []);

  function advance(next: number) {
    try {
      if (next < 0) localStorage.setItem(STORAGE_KEY, "done");
      else localStorage.setItem(STORAGE_KEY, String(next));
      setStep(next < 0 ? -1 : next);
    } catch {
      setStep(next < 0 ? -1 : next);
    }
  }

  if (step === null || step < 0) return null;

  return (
    <div className="card-modern-accent mb-2 px-4 py-3 text-sm text-neuro-silver">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {step === 0 && (
            <>
              <p className="mb-2 font-medium text-neuro-blue">Welcome. Step 1: Set your daily state</p>
              <p className="mb-2 text-neutral-300">Fill in energy, focus, and sensory load in the form below so your dashboard adapts to you.</p>
              <button
                type="button"
                onClick={() => advance(1)}
                className="btn-primary rounded-xl px-3 py-1.5 text-sm"
              >
                Next
              </button>
            </>
          )}
          {step === 1 && (
            <>
              <p className="mb-2 font-medium text-neuro-blue">Step 2: Add your first task or goal</p>
              <p className="mb-2 text-neutral-300">You’re all set. Add a task for today or set a savings goal to get started.</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard#tasks" className="btn-primary rounded-xl px-3 py-1.5 text-sm">
                  Add task
                </Link>
                <Link href="/budget" className="rounded-xl border border-white/20 px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5">
                  Set savings goal
                </Link>
                <button
                  type="button"
                  onClick={() => advance(-1)}
                  className="text-neutral-500 hover:text-neuro-silver"
                >
                  Skip
                </button>
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => advance(-1)}
          className="shrink-0 text-neutral-400 hover:text-white"
          aria-label="Dismiss onboarding"
        >
          ×
        </button>
      </div>
    </div>
  );
}
