"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addLearningSession } from "@/app/actions/learning";

type EducationOption = { id: string; name: string };

type Props = {
  date: string;
  targetMinutes?: number;
  educationOptions?: EducationOption[];
  pastTopics?: string[];
  initialEducationOptionId?: string | null;
};

const LEARNING_TYPES = [
  { value: "general" as const, label: "General" },
  { value: "reading" as const, label: "Reading" },
  { value: "course" as const, label: "Course" },
  { value: "podcast" as const, label: "Podcast" },
  { value: "video" as const, label: "Video" },
];

export function AddLearningSessionForm({ date, targetMinutes = 60, educationOptions = [], pastTopics = [], initialEducationOptionId = null }: Props) {
  const router = useRouter();
  const [minutes, setMinutes] = useState("");
  const [topic, setTopic] = useState("");
  const [educationOptionId, setEducationOptionId] = useState(initialEducationOptionId ?? "");
  const [learningType, setLearningType] = useState<"general" | "reading" | "course" | "podcast" | "video">("general");
  const [pending, startTransition] = useTransition();

  // When coming from "Start learning", prefill option and topic with full info
  useEffect(() => {
    if (initialEducationOptionId && educationOptions.length > 0) {
      setEducationOptionId(initialEducationOptionId);
      const option = educationOptions.find((o) => o.id === initialEducationOptionId);
      if (option?.name) setTopic(option.name);
    }
  }, [initialEducationOptionId, educationOptions]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const m = parseInt(minutes, 10);
    if (isNaN(m) || m <= 0) return;
    startTransition(async () => {
      await addLearningSession({
        minutes: m,
        date,
        topic: topic || undefined,
        education_option_id: educationOptionId || null,
        learning_type: learningType,
      });
      setMinutes("");
      setTopic("");
      setEducationOptionId("");
      setLearningType("general");
      router.refresh();
    });
  }

  function quickLog(m: number) {
    setMinutes(String(m));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Quick add</p>
          <div className="flex gap-2">
            {[15, 30, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => quickLog(m)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
              >
                +{m}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-muted)]">Minutes</span>
          <input
            type="number"
            min="1"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-24 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-muted)]">Topic (optional)</span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            list="past-topics"
            placeholder="e.g. React"
            className="w-44 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
          />
          {pastTopics.length > 0 && (
            <datalist id="past-topics">
              {pastTopics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          )}
        </label>
        <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
          Log session
        </button>
      </div>
      <div className="flex flex-wrap gap-4 border-t border-[var(--card-border)] pt-3">
        {educationOptions.length > 0 && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-muted)]">Log toward</span>
            <select
              value={educationOptionId}
              onChange={(e) => setEducationOptionId(e.target.value)}
              className="w-48 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            >
              <option value="">None</option>
              {educationOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--text-muted)]">Type</span>
          <select
            value={learningType}
            onChange={(e) => setLearningType(e.target.value as typeof learningType)}
            className="w-32 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
          >
            {LEARNING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
