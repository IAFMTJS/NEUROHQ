"use client";

import { useState, useEffect } from "react";

interface FocusLockModeProps {
  onStart: () => void;
  onEnd: () => void;
  energyLevel?: number;
}

export function FocusLockMode({ onStart, onEnd, energyLevel = 100 }: FocusLockModeProps) {
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const handleStart = () => {
    setIsActive(true);
    setElapsedSeconds(0);
    onStart();
  };

  const handleEnd = () => {
    setIsActive(false);
    setElapsedSeconds(0);
    onEnd();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isActive) {
    return (
      <button
        onClick={handleStart}
        className="w-full px-4 py-3 text-sm font-medium bg-[var(--accent-focus)] text-white rounded-lg hover:opacity-90"
      >
        🔒 Start Focus Lock Mode
      </button>
    );
  }

  const lowEnergy = energyLevel < 20;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-primary)] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="text-6xl font-mono font-bold text-[var(--text-primary)] mb-4">
          {formatTime(elapsedSeconds)}
        </div>
        <div className="text-sm text-[var(--text-muted)]">
          Energy: {energyLevel}%
        </div>
        {lowEnergy && (
          <div className="mt-2 text-sm text-red-500 font-medium">
            ⚠️ Low energy warning
          </div>
        )}
      </div>
      <button
        onClick={handleEnd}
        className="px-6 py-3 text-sm font-medium bg-red-500 text-white rounded-lg hover:opacity-90"
      >
        End Session
      </button>
      <p className="mt-4 text-xs text-[var(--text-muted)] text-center">
        Navigation disabled. Focus on your study.
      </p>
    </div>
  );
}
