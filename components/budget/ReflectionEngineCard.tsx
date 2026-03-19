"use client";

import { useState } from "react";

const QUESTIONS = [
  "Waarom kocht ik dit nu?",
  "Welk alternatief had ik?",
  "Wat wil ik volgende keer anders doen?",
];

export function ReflectionEngineCard() {
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);

  return (
    <section className="card-simple overflow-hidden p-0 ring-1 ring-sky-300/20 shadow-[0_0_20px_rgba(125,211,252,0.1)]">
      <div className="border-b border-[var(--card-border)] bg-[linear-gradient(90deg,rgba(125,211,252,0.1),rgba(139,92,246,0.04))] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Reflection engine</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Korte post-spend reflectie voor relapse prevention.</p>
      </div>
      <div className="space-y-3 p-4">
        {QUESTIONS.map((q, idx) => (
          <label key={q} className="block space-y-1">
            <span className="text-xs text-[var(--text-muted)]">{q}</span>
            <input
              type="text"
              value={answers[idx]}
              onChange={(e) =>
                setAnswers((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
              }
              className="w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
              placeholder="Kort antwoord"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
