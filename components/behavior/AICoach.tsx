"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface BehaviorPattern {
  id: string;
  pattern_type: string;
  suggestion: string;
  detected_at: string;
  acknowledged: boolean;
}

export function AICoach() {
  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("behavior_patterns")
        .select("*")
        .eq("user_id", user.id)
        .eq("acknowledged", false)
        .order("detected_at", { ascending: false })
        .limit(3);

      if (error) {
        const msg = error.message ?? "";
        const isMissingTable =
          msg.includes("schema cache") || msg.includes("relation") && msg.includes("does not exist");
        if (!isMissingTable) {
          console.error("Failed to load behavior patterns:", msg || error.code || JSON.stringify(error));
        }
        setPatterns([]);
      } else {
        setPatterns(data || []);
      }
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Failed to load behavior patterns:", message);
      setPatterns([]);
      setLoading(false);
    }
  };

  const acknowledgePattern = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("behavior_patterns")
        .update({ acknowledged: true })
        .eq("id", id);

      if (error) {
        console.error("Failed to acknowledge pattern:", error.message ?? error.code ?? JSON.stringify(error));
        return;
      }

      setPatterns((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to acknowledge pattern:", err instanceof Error ? err.message : String(err));
    }
  };

  if (loading || patterns.length === 0) return null;

  return (
    <div className="space-y-3">
      {patterns.map((pattern) => (
        <div
          key={pattern.id}
          className="card-simple border-blue-500/50 bg-blue-500/10"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl" aria-hidden>🤖</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Pattern Detected
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {pattern.suggestion}
              </p>
            </div>
            <button
              onClick={() => acknowledgePattern(pattern.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
