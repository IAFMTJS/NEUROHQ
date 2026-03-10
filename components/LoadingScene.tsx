type LoadingSceneProps = {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
};

/** Shared cinematic loading shell so every page has rich visuals while data is loading. */
export function LoadingScene({ title, subtitle, children }: LoadingSceneProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top,_#1b2140_0,_#050810_55%,_#02030a_100%)] text-[var(--text)]">
      {/* Neon grid / glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen"
      >
        <div className="absolute -left-40 top-[-10%] h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(122,255,255,0.16),_transparent_60%)] blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(255,120,220,0.18),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-[-20%] left-1/2 h-96 w-[120%] -translate-x-1/2 bg-[radial-gradient(circle_at_top,_rgba(120,200,255,0.22),_transparent_65%)] blur-3xl" />
      </div>

      {/* Subtle scanline overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.035)_1px,_transparent_1px)] bg-[size:100%_18px] opacity-40 mix-blend-soft-light"
      />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          {/* Header / hero */}
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
                NEUROHQ · COMMANDER
              </p>
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-[var(--text-strong)] md:text-3xl">
                {title ?? "Command deck is loading"}
              </h1>
              <p className="max-w-xl text-sm text-[var(--text-muted)]">
                {subtitle ??
                  "Booting XP engine, missions and analytics. Visual shell is ready; data syncs in the background."}
              </p>
            </div>

            {/* Animated status pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,#7afcff_45%,#6b21ff)] bg-[color-mix(in_srgb,#050810_80%,#0f172a)] px-4 py-2 text-xs text-[var(--text-soft)] shadow-[0_0_40px_rgba(122,252,255,0.35)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
              </span>
              <span>Synchronizing neuro-state</span>
            </div>
          </div>

          {/* Content frame */}
          <div className="glass-card relative overflow-hidden rounded-[26px] border border-white/6 bg-[color-mix(in_srgb,#050810_80%,#020617)] px-4 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.85)] md:px-6 md:py-7">
            {/* Corner brackets */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
            >
              <div className="absolute left-4 top-4 h-4 w-4 border-l border-t border-cyan-400/60" />
              <div className="absolute right-4 top-4 h-4 w-4 border-r border-t border-fuchsia-400/60" />
              <div className="absolute bottom-4 left-4 h-4 w-4 border-b border-l border-sky-400/60" />
              <div className="absolute bottom-4 right-4 h-4 w-4 border-b border-r border-violet-400/60" />
            </div>

            <div className="relative z-10">
              {children ?? (
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex-1 space-y-3">
                    <div className="h-7 w-32 rounded-full bg-white/5" />
                    <div className="h-5 w-56 rounded-full bg-white/5" />
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="h-24 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-sky-500/5 to-transparent" />
                      <div className="h-24 rounded-2xl bg-gradient-to-br from-fuchsia-500/15 via-purple-500/5 to-transparent" />
                      <div className="h-24 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent" />
                    </div>
                  </div>
                  <div className="hidden flex-1 justify-end md:flex">
                    <div className="h-32 w-32 rounded-full border border-white/12 bg-[radial-gradient(circle_at_30%_20%,rgba(244,244,245,0.85),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(129,230,217,0.9),transparent_55%)] shadow-[0_0_40px_rgba(80,250,255,0.45)]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

