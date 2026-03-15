"use client";

/**
 * NEUROHQ Help Center — Full system manual.
 * Standalone documentation page at /help. Does not import game engine or modify app state.
 * Content structure: content/help/sections.ts. Bump HELP_LAST_UPDATED when updating sections.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HELP_LAST_UPDATED } from "@/content/help/sections";

/* ----- Help page visual blocks ----- */
function HelpExample({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="help-example my-4 rounded-xl p-4 pl-5">
      {title && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent-cyan)]">{title}</p>}
      <div className="text-sm text-[var(--text-secondary)]">{children}</div>
    </div>
  );
}

function HelpTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="help-tip my-4 rounded-xl p-3 pl-5 text-sm text-[var(--text-secondary)]">
      <span className="mr-2 font-semibold text-[var(--accent-amber)]">💡 Tip:</span>
      {children}
    </div>
  );
}

function HelpTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="help-table-wrap my-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 1 ? "bg-white/[0.02]" : ""}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-[var(--text-secondary)]">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HelpStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-focus)]/20 text-xs font-bold text-[var(--accent-focus)]">{n}</span>
      <div className="min-w-0 flex-1 text-sm text-[var(--text-secondary)]">{children}</div>
    </div>
  );
}

function HelpRemember({ children }: { children: React.ReactNode }) {
  return (
    <div className="help-remember my-4 rounded-xl p-3 pl-5 text-sm text-[var(--text-secondary)]">
      <span className="mr-2 font-semibold text-[var(--accent-amber)]">✓ Good to know</span>
      {children}
    </div>
  );
}

/** Short bullets for quick scanning at the top of a section */
function HelpAtAGlance({ items }: { items: string[] }) {
  return (
    <ul className="my-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-cyan)]/70" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Simple horizontal flow: Step → Step → Step */
function HelpFlow({ steps }: { steps: string[] }) {
  return (
    <div className="my-4 flex flex-wrap items-center gap-2">
      {steps.map((label, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="rounded-lg border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/10 px-3 py-1.5 text-xs font-medium text-[var(--text-main)]">
            {label}
          </span>
          {i < steps.length - 1 && <span className="text-[var(--text-muted)]" aria-hidden>→</span>}
        </span>
      ))}
    </div>
  );
}

function RelatedSections({ ids }: { ids: string[] }) {
  const items = ids.map((id) => getSectionById(id)).filter(Boolean) as { id: string; title: string; num: number }[];
  if (items.length === 0) return null;
  return (
    <div className="help-related mt-6 rounded-xl p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Related sections</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="inline-block rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--accent-cyan)] hover:underline">
              {s.num}. {s.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TOC_GROUPS = [
  { label: "Getting started", ids: ["intro", "goal", "philosophy"] },
  { label: "Core features", ids: ["dashboard", "missions", "tasks", "card-entries", "auto-tasks", "budget", "growth"] },
  { label: "Progress & rewards", ids: ["xp-system", "level-system", "rank-system", "streak-system", "achievements", "stats", "insights"] },
  { label: "Reference", ids: ["settings", "data-storage", "automation", "progression-loop", "today-engine", "pages-routes", "faq", "undocumented"] },
] as const;

const SECTIONS: { id: string; title: string; num: number }[] = [
  { id: "intro", title: "Introduction", num: 1 },
  { id: "goal", title: "What NEUROHQ Is For", num: 2 },
  { id: "philosophy", title: "How the App Thinks", num: 3 },
  { id: "dashboard", title: "HQ (Dashboard)", num: 4 },
  { id: "missions", title: "Missions (Your Tasks)", num: 5 },
  { id: "tasks", title: "What Happens When You Complete a Task", num: 6 },
  { id: "card-entries", title: "Budget Entries (Income & Expenses)", num: 7 },
  { id: "auto-tasks", title: "How the App Suggests Missions", num: 8 },
  { id: "budget", title: "Budget Page", num: 9 },
  { id: "growth", title: "Growth (Learning)", num: 10 },
  { id: "xp-system", title: "How You Earn XP", num: 11 },
  { id: "level-system", title: "Your Level and Progress Bar", num: 12 },
  { id: "rank-system", title: "Your Rank", num: 13 },
  { id: "streak-system", title: "Your Streak", num: 14 },
  { id: "achievements", title: "Achievements (Badges)", num: 15 },
  { id: "stats", title: "Brain Status (Energy, Focus, Load)", num: 16 },
  { id: "insights", title: "Insight (Reports & Analytics)", num: 17 },
  { id: "settings", title: "Settings", num: 18 },
  { id: "data-storage", title: "Your Data", num: 19 },
  { id: "automation", title: "What the App Does Automatically", num: 20 },
  { id: "progression-loop", title: "How Your Progress Flows", num: 21 },
  { id: "today-engine", title: "How Today's Tasks Are Ordered", num: 22 },
  { id: "pages-routes", title: "Where Everything Lives", num: 23 },
  { id: "faq", title: "FAQ", num: 24 },
  { id: "undocumented", title: "For the Curious", num: 25 },
];

function getSectionById(id: string) {
  return SECTIONS.find((s) => s.id === id);
}

const KEY_TERMS: { term: string; def: string }[] = [
  { term: "XP", def: "Experience points you earn by completing tasks, learning, and staying consistent. They add up to level you up." },
  { term: "Level", def: "Your overall progress tier. Higher levels need more total XP. The progress bar shows how close you are to the next level." },
  { term: "Streak", def: "Consecutive days you’ve completed at least one task. Break a day and it resets; the app can remind you to keep it going." },
  { term: "Rank", def: "A title (e.g. Recruit, Operator) that unlocks as you hit level and streak milestones." },
  { term: "Brain status", def: "Your morning check-in: energy, focus, load (and optionally sleep, rest day). The app uses it to suggest missions and adapt rewards." },
  { term: "Missions / tasks", def: "Things to do. Some are suggested by the app (auto missions), others you add. Completing them earns XP and keeps your streak." },
  { term: "Critical / High impact / Growth boost", def: "How the app groups today’s tasks. Critical = do first (e.g. streak at risk); High impact = high XP; Growth boost = skill progress or rest of list." },
];

function KeyTermsBlock() {
  const [open, setOpen] = useState(false);
  return (
    <div className="help-key-terms rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-[var(--text-main)] rounded-t-xl transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">📖 Key terms</span>
        <span className="text-[var(--text-muted)] text-lg leading-none" aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <dl className="border-t border-white/10 px-4 py-3 space-y-2.5 text-sm">
          {KEY_TERMS.map(({ term, def }) => (
            <div key={term}>
              <dt className="font-semibold text-[var(--accent-cyan)]">{term}</dt>
              <dd className="text-[var(--text-secondary)] mt-0.5 pl-0">{def}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function AccordionSection({
  id,
  title,
  children,
  defaultOpen,
  sectionNum,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionNum?: number;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <section id={id} className="help-section" data-open={open ? "true" : "false"}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="help-section-heading w-full flex items-center justify-between gap-3 py-4 pl-2 pr-3 text-left font-semibold text-[var(--text-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]/50 focus:ring-offset-2 focus:ring-offset-[var(--bg-main)]"
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {sectionNum != null && (
            <span className="help-section-num flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold" aria-hidden>
              {sectionNum}
            </span>
          )}
          <span className="truncate">{title}</span>
        </span>
        <span className="text-[var(--text-muted)] shrink-0 text-lg leading-none transition-transform duration-200" aria-hidden style={{ transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      {open && (
        <div className="help-section-body pb-6 text-sm text-[var(--text-secondary)] space-y-4 [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-[var(--text-muted)] [&_h3]:first:mt-0 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[var(--accent-focus)] [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[var(--hud-dark-3)] [&_pre]:p-4 [&_pre]:text-xs [&_pre]:border [&_pre]:border-[var(--card-border)] [&_ul]:space-y-1 [&_ol]:space-y-1">
          {children}
        </div>
      )}
    </section>
  );
}

export default function HelpPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showBackToContents, setShowBackToContents] = useState(false);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackToContents(typeof window !== "undefined" && window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={containerRef} className="container page help-page max-w-3xl mx-auto pb-24">
      <header className="mb-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 mb-5 transition-colors">
          ← Back to HQ
        </Link>
        <h1 className="page-title-glow text-3xl md:text-5xl font-bold tracking-tight">Help Center</h1>
        <p className="text-[var(--text-muted)] mt-3 text-lg max-w-xl leading-relaxed">
          Learn how to get around the app, what each screen does, and how your progress and rewards work—in plain language.
        </p>
      </header>

      <div className="help-quick-start rounded-2xl p-6 mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/20 text-xl" aria-hidden>🚀</span>
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Quick start</h2>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-8 mb-4">
          <div className="flex gap-3 items-start">
            <span className="help-step-num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">1</span>
            <p className="text-sm text-[var(--text-secondary)]">Open <strong>HQ</strong> and log your <strong>brain status</strong> (energy, focus, load).</p>
          </div>
          <div className="flex gap-3">
            <span className="help-step-num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">2</span>
            <p className="text-sm text-[var(--text-secondary)]">Go to <strong>Missions</strong> — complete today’s tasks to earn XP and keep your streak.</p>
          </div>
          <div className="flex gap-3">
            <span className="help-step-num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">3</span>
            <p className="text-sm text-[var(--text-secondary)]">Check <strong>XP</strong> and <strong>Insight</strong> to see progress and patterns.</p>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Use the table of contents below to jump to any section. Each section can be expanded or collapsed.
        </p>
      </div>

      <nav id="help-toc" aria-label="Table of contents" className="rounded-2xl p-6 mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-5">Table of contents</h2>
        <div className="space-y-6">
          {TOC_GROUPS.map((group) => {
            const items = group.ids.map((id) => getSectionById(id)).filter(Boolean) as { id: string; title: string; num: number }[];
            return (
              <div key={group.label}>
                <p className="help-toc-group-label text-[11px] font-semibold uppercase tracking-widest mb-2.5">{group.label}</p>
                <ul className="grid gap-1 text-sm sm:grid-cols-2">
                  {items.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(s.id)}
                        className="help-toc-link text-left w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-medium"
                      >
                        <span className="help-toc-num flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold">{s.num}</span>
                        {s.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="space-y-0">
        <AccordionSection id="intro" title="1. Introduction" defaultOpen sectionNum={1}>
          <HelpAtAGlance items={["One app: tasks, energy, budget, learning", "Adapts to how you feel", "Use table of contents to jump"]} />
          <p>NEUROHQ is your <strong>daily HQ</strong>—tasks, energy check-in, budget, learning, and strategy in one place. The app uses your energy and focus to suggest the right number and type of missions.</p>
          <p><strong>This page:</strong> every main screen in plain language. Use the table of contents below; click a section to open or close it. Share <code>/help#xp-system</code> to link to a section.</p>
          
          <KeyTermsBlock />
        </AccordionSection>

        <AccordionSection id="goal" title="2. What NEUROHQ Is For" sectionNum={2}>
          <p>
            NEUROHQ is built to be <strong>the one app you open every day</strong>: your tasks, your energy, your budget, your learning, and your strategy—all in one place, designed around how you actually feel and work.
          </p>
          <h3>How it’s different</h3>
          <p>
            The app doesn’t just list tasks. It <strong>adapts to your energy and focus</strong>: on low-energy days it suggests fewer or lighter missions; on high-load days it may show more recovery-style options. It’s calendar-aware and designed to help you execute without burning out.
          </p>
          <h3>What you can do</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Tasks that fit your day</strong> — The app suggests 2–4 missions based on your morning check-in.</li>
            <li><strong>Energy-aware rewards</strong> — You earn XP for completing tasks; doing them when your energy is good can earn you more.</li>
            <li><strong>Budget &amp; savings</strong> — Log income and expenses, set goals, and use “freeze” on impulse purchases.</li>
            <li><strong>Learning &amp; growth</strong> — Track what you’re learning, hit weekly targets, and reflect.</li>
            <li><strong>Strategy</strong> — Set a quarterly focus and see how aligned your actions are.</li>
            <li><strong>Insights</strong> — See your patterns, streaks, and progress over time.</li>
          </ul>
          <p>You can turn on a lighter theme and reduced motion in <strong>Settings</strong> if that works better for you.</p>
        </AccordionSection>

        <AccordionSection id="philosophy" title="3. How the App Thinks" sectionNum={3}>
          <h3>The app helps you choose what to do first</h3>
          <p>
            Instead of showing a long list in random order, NEUROHQ <strong>surfaces the most important things first</strong>. If your streak is at risk, it highlights “Critical” tasks so you know what to do to keep the streak. It also groups tasks into High impact (bigger XP) and Growth boost so you can see what matters most today.
          </p>
          <h3>Gentle consequences, not guilt</h3>
          <p>
            When you’re low on energy or have been inactive for a while, the app doesn’t punish you—it <strong>adjusts</strong>. You might see fewer or lighter missions, or slightly less XP until you’re back in rhythm. The goal is to nudge you toward sustainable habits without shame.
          </p>
          <h3>Rewards for showing up</h3>
          <p>
            Your <strong>streak</strong>, <strong>level</strong>, and <strong>achievements</strong> reward consistency. Completing tasks in your “prime window” (your most productive hours) can earn you a bit of extra XP. The app also encourages variety: if you complete many similar tasks in one day, the extra XP from the later ones is slightly reduced so spreading effort across different areas is rewarded too.
          </p>
        </AccordionSection>

        <AccordionSection id="dashboard" title="4. HQ (Dashboard)" sectionNum={4}>
          <HelpAtAGlance items={["Home screen: level, streak, today's missions", "Brain status first then Missions", "Heatmap, quick budget log, shortcuts"]} />
          <HelpFlow steps={["Open HQ", "Brain status", "Save", "Missions"]} />
          <p>
            <strong>HQ</strong> = home screen. Level, XP, streak, today's missions, heatmap, quick budget log. Do <strong>brain status</strong> first so the app can suggest 2–4 missions when you open Missions. </p>
          <ul className="list-disc pl-5 space-y-0.5 text-sm">
            <li><strong>Brain status</strong> — Energy, focus, load (and sleep, rest day). Drives mission count and type.</li>
            <li><strong>Level &amp; progress</strong> — Current level, XP to next, rank.</li>
            <li><strong>Streak</strong> — Days in a row with at least one task; "streak at risk" if you missed yesterday.</li>
            <li><strong>Today's missions</strong> — Critical / High impact / Growth boost.</li>
            <li><strong>Heatmap</strong> — Which days you completed tasks.</li>
          </ul>
          <HelpTip>Brain status first each day = suggested missions and fair rewards.</HelpTip>
          <RelatedSections ids={["stats", "missions", "progression-loop"]} />
        </AccordionSection>

        <AccordionSection id="missions" title="5. Missions (Your Tasks)" sectionNum={5}>
          <HelpAtAGlance items={["Today, Calendar, Routines, Overdue", "Complete task → XP + streak", "Recovery missions when load is high"]} />
          <p>
            <strong>Missions</strong> = where you see and complete tasks. Some suggested by the app (from brain status), others you add. Mark done → get XP, update streak, maybe level up.
          </p>
          <h3>What you’ll see</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Tabs at the top</strong> — Today (default), Calendar, Routines, Overdue. Switch to see a different view of your tasks.</li>
            <li><strong>Energy bar</strong> — How much of your “daily energy budget” you’ve used. The app uses this so you don’t get overloaded with heavy tasks.</li>
            <li><strong>Messages from the app</strong> — If you haven’t completed anything in 5+ days, you might see a recovery message or a nudge to do one small thing. That’s the app helping you get back on track.</li>
            <li><strong>Yesterday’s unfinished tasks</strong> — So you can complete them and keep things tidy.</li>
            <li><strong>Today’s mission cards</strong> — Each task as a card: you can mark it complete, postpone it, or open it for more options.</li>
            <li><strong>Full task list</strong> — All tasks for the day or view you selected.</li>
            <li><strong>Backlog and future</strong> — Tasks with no date or a future date, so you can plan ahead.</li>
            <li><strong>Calendar</strong> — Pick a date to see or edit tasks for that day.</li>
          </ul>
          <h3>When you complete a task</h3>
          <p>As soon as you mark a task done, the app gives you XP (based on the task and your energy, timing, etc.), updates your streak if you completed something today, and may level you up or unlock an achievement. If the task was recurring, the next occurrence is added automatically. You don’t have to do anything else—just complete and move on.</p>
          <h3>When the app shows only “recovery” missions</h3>
          <p>If your load is very high or the app detects you’re close to burnout, it may show only lighter, recovery-style missions (e.g. rest, reflection, short walks). That’s to protect you from overdoing it. Once you’re in a better place, the full mix of missions returns.</p>
          <HelpTip>Do at least one task every day to keep your streak. If you skip a day, the streak resets to 1 the next time you complete something. If you’re taking a rest day on purpose, you can mark it in brain status so the app doesn’t treat it as a broken streak.</HelpTip>
          <RelatedSections ids={["tasks", "streak-system", "today-engine"]} />
        </AccordionSection>

        <AccordionSection id="tasks" title="6. What Happens When You Complete a Task" sectionNum={6}>
          <p>
            Every task has a title, a due date, and (for suggested missions) an idea of how much energy or focus it needs. When you <strong>complete</strong> a task, the app does several things for you in the background so your progress stays accurate.
          </p>
          <h3>What the app does when you complete a task</h3>
          <div className="space-y-2">
            <HelpStep n={1}>It checks whether you did it on the due date or late (on-time completions are rewarded a bit more).</HelpStep>
            <HelpStep n={2}>It looks at how well the task matched your energy and focus today and gives you a performance grade (S, A, B, or C). Higher grades mean a bit more XP.</HelpStep>
            <HelpStep n={3}>It adds XP to your total. The amount depends on the task, your grade, your energy, whether you’re in your “prime window,” and a few other factors.</HelpStep>
            <HelpStep n={4}>It updates your streak: if you completed something yesterday, your streak goes up by 1; if you missed a day, it resets to 1.</HelpStep>
            <HelpStep n={5}>If the task repeats (e.g. weekly), the app creates the next occurrence so you don’t have to.</HelpStep>
            <HelpStep n={6}>If it was a “recovery” task (e.g. rest, reflection), the app may slightly improve tomorrow’s suggested energy/load so you feel the benefit.</HelpStep>
          </div>
          <h3>Other things you can do with tasks</h3>
          <p><strong>Uncomplete</strong> — If you marked something done by mistake, you can uncheck it. <strong>Delete</strong> — Remove a task (you can often restore it if needed). <strong>Subtasks</strong> — Some tasks can have sub-items. <strong>Backlog</strong> — Tasks with no date or a past date; <strong>Future</strong> — Tasks scheduled for later. You can move tasks between today, backlog, and future as you plan your week.</p>
        </AccordionSection>

        <AccordionSection id="card-entries" title="7. Budget Entries (Income &amp; Expenses)" sectionNum={7}>
          <p>
            On the <strong>Budget</strong> page you log <strong>income</strong> and <strong>expenses</strong>. Each entry has an amount, date, category, and optional note. You can mark an expense as planned (e.g. rent) or unplanned (e.g. an impulse buy). The app uses this to show you how you’re doing against your budget and to help you spot impulse spending.
          </p>
          <h3>Adding an entry</h3>
          <p>You enter the amount, pick the date, choose a category (e.g. Food, Transport), and add a note if you want. If it’s a one-off unplanned expense, the app may ask whether you want to “freeze” it—a way to pause before committing it to your budget.</p>
          <h3>Freeze (for impulse control)</h3>
          <p>When you add an unplanned expense, you can choose <strong>Freeze</strong>. The entry is then “on hold” for a set time (e.g. 24 hours). Before the freeze ends you can <strong>Confirm</strong> (yes, I spent it—it counts in your budget) or <strong>Cancel</strong> (I didn’t spend it—you can even move that amount to a savings goal). You can have up to 5 frozen items at once; confirm or cancel one before freezing another.</p>
          <h3>Editing and deleting</h3>
          <p>You can edit any entry (amount, date, category, note) or delete it. Your list is shown by week or month so you can see your spending over time.</p>
          <HelpExample title="Example: Using freeze">
            <p>You log €25 for a takeaway you’re thinking about. The app offers “Freeze.” You tap it. For the next 24 hours the €25 isn’t counted in your budget. You decide not to order—you tap Cancel and optionally send the €25 to a savings goal. If you had ordered, you’d tap Confirm and the €25 would stay as an expense.</p>
          </HelpExample>
        </AccordionSection>

        <AccordionSection id="auto-tasks" title="8. How the App Suggests Missions" sectionNum={8}>
          <p>
            NEUROHQ can <strong>suggest 2–4 tasks for you each day</strong> based on how you feel. These are “auto” missions: the app picks them from a pool (e.g. focus sprints, walks, learning, recovery) so you don’t have to think of what to do. You can still add your own tasks; the suggested ones just give you a starting point.
          </p>
          <h3>When do suggested missions appear?</h3>
          <p>They’re created when you open the Missions tab—but only if you’ve already <strong>saved your brain status</strong> for today on HQ. If you haven’t done the check-in, the app doesn’t know your energy and focus, so it won’t create suggestions. Make brain status your first step each day.</p>
          <h3>How many will I get?</h3>
          <p>Usually between 2 and 4. The exact number depends on your energy, focus, load, and sleep. For example: good energy and focus with decent sleep often give you 3–4 missions; low energy or high load may give you 2 and more recovery-style options. The app avoids repeating the same mission you did in the last few days so you get variety.</p>
          <h3>Can I turn this off?</h3>
          <p>Yes. In <strong>Settings</strong> you can disable “auto master missions” if you prefer to plan everything yourself. You can also set your usual days off (e.g. weekend) so the app doesn’t suggest heavy missions on those days if you don’t want them.</p>
          <HelpExample title="Example">
            <p>You log energy 5, focus 6, load 4, sleep 7 hours. You open Missions. The app creates three suggested tasks: e.g. “Focus Sprint 10 min,” “20 Min Walk,” “Read 10 Pages.” If you had logged energy 2 and load 8, you might get two lighter tasks like “Meditation 10 min” and “Energy Audit” instead.</p>
          </HelpExample>
        </AccordionSection>

        <AccordionSection id="budget" title="9. Budget Page" sectionNum={9}>
          <p>
            The <strong>Budget</strong> tab is where you manage your money in the app: see how much you have left to spend, log income and expenses, track savings goals, and spot patterns.
          </p>
          <h3>What you’ll find</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Remaining budget</strong> — How much you have left for the week or month based on your income and spending.</li>
            <li><strong>Add entry</strong> — Log income or an expense (amount, date, category, note).</li>
            <li><strong>List of entries</strong> — All your income and expenses for the period so you can edit or delete.</li>
            <li><strong>Savings goals</strong> — Set a goal (e.g. holiday fund) and track how much you’ve put aside.</li>
            <li><strong>Frozen purchases</strong> — Entries you put on hold with “Freeze”; confirm or cancel before they count.</li>
            <li><strong>Recurring items</strong> — Things like rent or subscriptions so you don’t have to re-enter them every time.</li>
            <li><strong>Charts and insights</strong> — Where your money goes (categories), weekly performance, and tips to stay on track.</li>
          </ul>
          <p>You can switch between the current month and past months, and export your data (e.g. CSV) from Settings or the Budget area if you need it elsewhere.</p>
        </AccordionSection>

        <AccordionSection id="growth" title="10. Growth (Learning)" sectionNum={10}>
          <p>
            The <strong>Growth</strong> tab is your learning hub. You can set what you want to focus on (e.g. a book or skill), log learning sessions, and see how consistent you are. The app rewards learning with extra XP when you hit your weekly target.
          </p>
          <h3>What you can do here</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Set your focus</strong> — What are you learning right now? (e.g. “Finish chapter 5 of X”)</li>
            <li><strong>Track a book or stream</strong> — Add a book (or other learning stream) and optionally track pages or progress.</li>
            <li><strong>See consistency</strong> — How many days this week or month you did some learning.</li>
            <li><strong>Reflect</strong> — Short reflection on what you learned or what to do differently.</li>
          </ul>
          <p>When you log a learning session (e.g. “Read 20 minutes” or “Practice 30 min”), you earn a small amount of XP. If you hit your weekly learning target, you get a bigger XP bonus. There’s a separate <strong>Learning analytics</strong> screen (reachable from Growth) where you can see your heatmap and summary in more detail.</p>
        </AccordionSection>

        <AccordionSection id="xp-system" title="11. How You Earn XP" sectionNum={11}>
          <HelpAtAGlance items={["Tasks, brain status, learning, streak", "Good energy + on time + prime window = more XP", "Table below: what boosts or reduces"]} />
          <p><strong>XP</strong> = experience points. You earn them from tasks, brain status, learning, and streak. Total XP = your level and rank.</p>
          <HelpRemember>Your total XP determines your level. Section 12 explains the progress bar; section 21 shows how everything fits together in your daily flow.</HelpRemember>
          <h3>Ways to earn XP</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Complete a task</strong> — Usually around 50 XP per task, but the final amount can be higher or lower (see below).</li>
            <li><strong>Log brain status</strong> — A small bonus (5 XP) for checking in so the app can adapt.</li>
            <li><strong>Log a learning session</strong> — 8 XP per session.</li>
            <li><strong>Hit your weekly learning target</strong> — 25 XP bonus.</li>
            <li><strong>Streak day</strong> — A small bonus (5 XP) when your streak is active.</li>
          </ul>
          <h3>What makes task XP go up or down?</h3>
          <p>The app multiplies your base task XP by several factors so that <strong>how</strong> and <strong>when</strong> you work matters:</p>
          <HelpTable headers={["When this happens", "Effect on XP"]} rows={[["You complete on time and energy matches the task (grade S or A)", "Up to 15% or 5% more XP"], ["You complete in your “prime window” (your best 2 hours)", "10% more XP"], ["Your energy was high when you completed", "Up to 15% more XP"], ["Your energy was very low", "Up to 20–25% less XP"], ["You’ve done many similar tasks the same day", "Slightly less XP (encourages variety)"], ["You haven’t completed anything in 5+ days", "Slightly less XP until you’re back in rhythm"]]} />
          <HelpExample title="Example">
            <p>Base 50 XP, on time + A (+5%), prime window (+10%) → about 57 XP. Very low energy → less XP and maybe a "low synergy" nudge.</p>
          </HelpExample>
          <RelatedSections ids={["level-system", "streak-system", "progression-loop"]} />
        </AccordionSection>

        <AccordionSection id="level-system" title="12. Your Level and Progress Bar" sectionNum={12}>
          <p>
            Your <strong>level</strong> goes from 1 to 100. It’s based on your <strong>total XP</strong>: the more you earn, the higher your level. The progress bar on HQ and the XP page shows how far you are through your current level and how much XP you need for the next one. Your <strong>level</strong> is shown prominently (e.g. in accent color); your <strong>total XP</strong> is shown as secondary.
          </p>
          <h3>How much XP for each level?</h3>
          <HelpTable headers={["Level", "Total XP you need", "XP needed to reach next level"]} rows={[["1", "0 – 99", "100"], ["2", "100 – 249", "150"], ["3", "250 – 499", "250"], ["4", "500 – 849", "350"], ["5", "850 – 1,299", "450"], ["6", "1,300 – 1,899", "600"], ["7", "1,900 – 2,649", "750"], ["8", "2,650 – 3,599", "950"], ["9", "3,600 – 4,799", "1,200"], ["10", "4,800 – 6,000", "~1,200"], ["…", "…", "…"], ["100", "Max", "—"]]} />
          <HelpExample title="Example">
            <p>You have 420 total XP. You’re in <strong>level 4</strong> (level 5 starts at 500). You need <strong>80 more XP</strong> to reach level 5. The progress bar might show about 68% full—that’s how far you are through level 4.</p>
          </HelpExample>
        </AccordionSection>

        <AccordionSection id="rank-system" title="13. Your Rank" sectionNum={13}>
          <p>
            As you level up, your <strong>rank</strong> (title) changes. It’s a way to see how far you’ve come. Ranks start at <strong>Recruit</strong> (level 1) and go up through <strong>Operator</strong>, <strong>Specialist</strong>, <strong>Commander</strong>, and more—all the way to <strong>Dark Commander</strong> at very high levels. You’ll see your current rank on HQ and on the XP page.
          </p>
          <h3>What do ranks give you?</h3>
          <p>Higher ranks can unlock things like more mission variety, access to the skill tree, autopilot suggestions, and custom missions. The app will show you what’s next when you’re close to a new rank.</p>
          <h3>Progression ladder (recruit → commander)</h3>
          <p>There’s also a separate “progression” ladder (Recruit → Operator → Specialist → Commander). You unlock the next step by hitting targets: e.g. enough total XP, a minimum streak, and a good completion rate over the last week. Commander-level players get a small XP bonus as a reward for consistency.</p>
        </AccordionSection>

        <AccordionSection id="streak-system" title="14. Your Streak" sectionNum={14}>
          <p>
            Your <strong>streak</strong> is the number of days in a row you’ve completed at least one task. It’s shown on HQ and helps you stay consistent. The app also uses it for small XP bonuses and for unlocking certain ranks and achievements.
          </p>
          <h3>How does the streak change?</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>You complete a task today</strong> and you completed something yesterday → your streak goes up by 1.</li>
            <li><strong>You complete a task today</strong> but you didn’t complete anything yesterday (or the day before) → your streak resets to 1.</li>
            <li><strong>You complete several tasks on the same day</strong> → that still counts as one day; your streak doesn’t jump by more than 1 for that day.</li>
            <li><strong>You don’t complete anything for 5 days in a row</strong> → the app sets your current streak to 0 (streak decay). Your “longest streak ever” is still saved for achievements.</li>
          </ul>
          <p>So: to grow your streak, complete at least one task every day. If you miss a day, the next time you complete something your streak starts again at 1.</p>
          <HelpExample title="Example">
            <p>Monday you complete one task → streak is 1. Tuesday you complete again → streak is 2. Wednesday you do nothing. Thursday you complete a task → the app sees your last completion was Tuesday (2 days ago), so your streak resets to 1. If you then don’t complete anything for the next 5 days, your streak goes to 0, but your “longest streak” (2) is still remembered for badges.</p>
          </HelpExample>
        </AccordionSection>

        <AccordionSection id="achievements" title="15. Achievements (Badges)" sectionNum={15}>
          <p>
            <strong>Achievements</strong> are badges you unlock by hitting milestones. They’re a way to celebrate progress and stay motivated. You might see them on HQ or in your profile.
          </p>
          <h3>Examples of achievements</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>First Mission</strong> — Complete your first task.</li>
            <li><strong>7 Day Streak</strong> — Reach a 7-day streak.</li>
            <li><strong>30 Day Streak</strong> — Reach a 30-day streak.</li>
            <li><strong>Level 10 / 25 / 50</strong> — Reach that level.</li>
            <li><strong>100 Missions</strong> — Complete 100 tasks in total.</li>
            <li><strong>Perfect Week</strong> — Hit every day of the week with at least one completion.</li>
          </ul>
          <p>On the Budget page there are separate achievements for financial milestones (e.g. staying within budget, hitting savings goals).</p>
        </AccordionSection>

        <AccordionSection id="stats" title="16. Brain Status (Energy, Focus, Load)" sectionNum={16}>
          <p>
            When you do the <strong>brain status check-in</strong> on HQ, you tell the app how you feel.
            You set sliders for energy, focus, and load; you can also add sleep and social load, and whether today is a rest day. The app uses this to decide how many missions to suggest and what type (e.g. more recovery when load is high).
          </p>
          <h3>What the app does with your answers</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Number of missions</strong> — Higher energy and focus (and good sleep) tend to mean 3–4 suggested tasks; low energy or high load may mean 2 and more restful options.</li>
            <li><strong>Type of missions</strong> — If your load is very high or the app detects you are close to burnout, it may show only recovery-style tasks (rest, reflection, light movement) until you are in a better place.</li>
            <li><strong>XP</strong> — Completing tasks when your energy is high can earn you a bit more XP; when it is very low, the app may give slightly less XP and nudge you to save heavy tasks for better days.</li>
          </ul>
          <p>There is no wrong answer—be honest so the app can adapt to you. You can mark a day as a <strong>rest day</strong> so the app does not treat zero completions that day as a broken streak.</p>
        </AccordionSection>

        <AccordionSection id="insights" title="17. Insight (Reports &amp; Analytics)" sectionNum={17}>
          <p>
            The <strong>Insight</strong> tab (sometimes called Report) is where you see the bigger picture: your momentum, how much XP you earned and from what, when you tend to complete tasks, and how consistent you are. It’s useful for spotting patterns and staying motivated.
          </p>
          <h3>What you’ll find</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Momentum</strong> — A quick view of how you’re doing lately.</li>
            <li><strong>Key numbers</strong> — XP, completions, streak, and other highlights.</li>
            <li><strong>Graphs</strong> — XP over the last 30 days, weekly comparison, and where your XP comes from (tasks, learning, etc.).</li>
            <li><strong>Heatmap</strong> — Which hours of the day you usually complete tasks (helps you find your “prime window”).</li>
            <li><strong>Consistency</strong> — How regular your completion pattern is.</li>
            <li><strong>Risk and coach</strong> — The app may highlight when you’re at risk of dropping off or suggest a small next step.</li>
            <li><strong>Reality report</strong> — A weekly summary you can look back on.</li>
          </ul>
          <p>You can switch between weeks to compare and dig into what’s working.</p>
        </AccordionSection>

        <AccordionSection id="settings" title="18. Settings" sectionNum={18}>
          <p>
            <strong>Settings</strong> is where you control your account and how the app looks and behaves. Open it from the bottom navigation or the HQ shortcuts.
          </p>
          <h3>What you can change</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account</strong> — Your email and account details.</li>
            <li><strong>Appearance</strong> — Theme (dark/light), compact layout, reduced motion, and light UI option. You can also see your XP badge here.</li>
            <li><strong>Behavior &amp; missions</strong> — Your “behavior profile” (how you identify, week theme, avoidance), and whether the app should suggest auto-missions. You can set your usual days off (e.g. weekend) and whether those are soft (lighter missions) or hard (no suggestions).</li>
            <li><strong>Time &amp; notifications</strong> — Timezone and push notifications (e.g. daily quote, reminders, quiet hours).</li>
            <li><strong>Budget &amp; currency</strong> — Currency and budget-related options.</li>
            <li><strong>Calendar</strong> — Connect Google Calendar or Apple Calendar if you use them.</li>
            <li><strong>Export &amp; data</strong> — Export your data (e.g. CSV) and, if you ever want to leave, delete your account. There’s also an option to clear cached data and an “About” section.</li>
          </ul>
        </AccordionSection>

        <AccordionSection id="data-storage" title="19. Your Data" sectionNum={19}>
          <p>
            Your progress—XP, level, streak, tasks, budget entries, savings goals, learning, and settings—is saved securely and tied to your account. Nothing is shared with other users. You can export your data from Settings if you need a copy, and you can delete your account and data at any time from Settings.
          </p>
          <p>The app also remembers small UI preferences (e.g. which cards on HQ are collapsed, your theme choice) on your device so your experience stays consistent when you return.</p>
        </AccordionSection>

        <AccordionSection id="automation" title="20. What the App Does Automatically" sectionNum={20}>
          <p>
            NEUROHQ does a few things in the background so you don’t have to think about them.
          </p>
          <h3>Suggested missions</h3>
          <p>When you open the Missions tab (and you’ve already done your brain status for today), the app creates 2–4 suggested tasks for you. You can turn this off in Settings if you prefer to plan everything yourself.</p>
          <h3>Prime window</h3>
          <p>The app learns when you usually complete tasks (e.g. “between 9 and 11 am”). That 2-hour block is your <strong>prime window</strong>. When you complete a task in that window, you get a small XP bonus (10% extra). So working in your natural rhythm is rewarded.</p>
          <h3>Streak and reminders</h3>
          <p>If you don’t complete anything for 5 days, the app resets your streak to 0 so the number stays honest. It may also send you a gentle reminder or recovery message. Notifications (e.g. daily quote, frozen purchase reminder) can be configured in Settings.</p>
        </AccordionSection>

        <AccordionSection id="progression-loop" title="21. How Your Progress Flows" sectionNum={21}>
          <p className="rounded-lg border border-[var(--card-border)] bg-[var(--hud-dark-2)]/50 px-3 py-2 text-xs text-[var(--text-muted)]">
            <strong className="text-[var(--text-secondary)]">In short:</strong> Log how you feel → the app suggests missions → you complete tasks → you earn XP and keep your streak → you level up and unlock ranks. When you’re low on energy or have been inactive, the app adapts (e.g. recovery-style tasks, streak reset after long inactivity).
          </p>
          <h3>Your typical flow</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Morning</strong>: Open the app and, if you like, do the brain status check-in. Your answers are saved so the app can suggest the right number and type of missions for today.</li>
            <li><strong>Missions</strong>: The app creates 2–4 suggested tasks for today and groups them (e.g. “do first,” “high impact,” “growth”). You see today’s list and can complete tasks in any order.</li>
            <li><strong>Completing a task</strong>: The app scores your performance (S/A/B/C), calculates your XP with all bonuses, and updates your total XP, level, and streak. It may also unlock achievements, update your economy (discipline points, etc.), and adjust what it suggests next.</li>
            <li><strong>When you’re drained or inactive</strong>: If your energy is very low, your load is very high, or you haven’t completed anything for several days, the app may show only recovery-style missions or tweak rewards until you’re in a better place.</li>
            <li><strong>Over the week</strong>: The app looks at your last 7 days (performance, consistency) and may adjust reward and difficulty slightly. When you hit the right mix of XP, streak, and completion rate, you can unlock the next progression rank.</li>
            <li><strong>Achievements</strong>: As you hit milestones, new achievements unlock and appear in your profile.</li>
            <li><strong>Strategy</strong>: Your alignment with your quarterly theme and your momentum affect which tasks get emphasized and can slightly affect XP.</li>
          </ol>
        </AccordionSection>

        <AccordionSection id="today-engine" title="22. How Today’s Tasks Are Ordered">
          <p>
            The app groups today’s tasks into three categories so you know what to do first: <strong>Critical</strong>, <strong>High Impact</strong>, and <strong>Growth Boost</strong>. The order is suggested by the app based on your streak, energy, and rewards.
          </p>
          <h3>What each group means</h3>
          <HelpTable headers={["Group", "Meaning", "What you’ll see"]} rows={[["Critical", "Do first — your streak is at risk or these are must-dos", "Usually the first 1–2 tasks when you didn’t complete anything yesterday"], ["High impact", "High XP and a good fit for your energy", "A few tasks with the highest rewards, so the app surfaces them near the top"], ["Growth boost", "Skill progress, lower XP, or the rest of your list", "Tasks that help you unlock skills or fill out the rest of today’s list"]]} />
          <HelpExample title="Example: When “Critical” appears">
            If you didn’t complete anything yesterday, your streak is at risk. The app marks the first couple of tasks as <strong>Critical</strong> and shows them at the top. Finishing one of them today keeps your streak alive. On a normal day (after you completed something yesterday), Critical might be empty and you’ll see High impact and Growth boost first.
          </HelpExample>
        </AccordionSection>

        <AccordionSection id="pages-routes" title="23. Where Everything Lives" sectionNum={23}>
          <p>A quick map of the app: where to go for what.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Home</strong> (<code>/</code>) — If you’re not logged in, you’ll see sign in or sign up. If you’re logged in, you’re taken to HQ.</li>
            <li><strong>Log in / Sign up / Forgot password</strong> (<code>/login</code>, <code>/signup</code>, <code>/forgot-password</code>) — Sign in, create an account, or reset your password.</li>
            <li><strong>HQ (Dashboard)</strong> (<code>/dashboard</code>) — Your main hub: brain status check-in, level, streak, today’s missions preview, activity heatmap, and a quick way to log a budget entry.</li>
            <li><strong>Missions</strong> (<code>/tasks</code>) — Today’s tasks, calendar, routines, overdue list, and the full task list. You’ll see your energy cap and can complete or reschedule tasks.</li>
            <li><strong>Budget</strong> (<code>/budget</code>) — Income and expenses, goals, recurring items, frozen purchases, discipline tracking, and budget insights.</li>
            <li><strong>Growth</strong> (<code>/learning</code>) — Learning intent, streams, consistency, and reflection.</li>
            <li><strong>Learning analytics</strong> (<code>/learning/analytics</code>) — Weekly learning summary and funnel.</li>
            <li><strong>XP</strong> (<code>/xp</code>) — Your XP chart, heatmap, forecast, and identity view.</li>
            <li><strong>Strategy</strong> (<code>/strategy</code>) — Your quarterly theme, alignment, momentum, and drift.</li>
            <li><strong>Insight (Report)</strong> (<code>/report</code>) — Reality report, momentum, graphs, heatmap, risk, and coach.</li>
            <li><strong>Analytics</strong> (<code>/analytics</code>) — Week summary, task and learning completion, funnel.</li>
            <li><strong>Maker analytics</strong> (<code>/analytics/maker</code>) — Maker-focused analytics.</li>
            <li><strong>Assistant</strong> (<code>/assistant</code>) — Chat with the AI, get suggested actions, and add tasks, expenses, calendar events, or learning.</li>
            <li><strong>Settings</strong> (<code>/settings</code>) — Account, theme, notifications, budget and calendar options, export, and delete account.</li>
            <li><strong>Help</strong> (<code>/help</code>) — This help center.</li>
            <li><strong>Offline</strong> (<code>/offline</code>) — Shown when you don’t have a connection.</li>
          </ul>
        </AccordionSection>

        <AccordionSection id="faq" title="24. FAQ" defaultOpen sectionNum={24}>
          <p className="text-[var(--text-muted)] mb-4">Short answers to common questions. For more detail, open the section mentioned.</p>
          <ul className="list-disc pl-5 space-y-3">
            <li><strong>Where do I log my energy?</strong> On HQ (Dashboard), use the brain status check-in. Your answers are saved for today and used to suggest missions and adapt rewards.</li>
            <li><strong>Why are my missions different some days?</strong> The app uses your energy, focus, load, and sleep to decide how many missions to suggest and which types. Low energy or high load can mean fewer tasks or more recovery-style options.</li>
            <li><strong>How is XP calculated for a task?</strong> A base amount is multiplied by several factors (your rank, alignment, energy, prime time, recovery state, etc.). Section 11 explains each factor. The minimum you can earn for a task is 1 XP.</li>
            <li><strong>What breaks my streak?</strong> A day with no completed task. If you go 5 or more days in a row without completing anything, your streak resets to 0.</li>
            <li><strong>What is the prime window?</strong> The app looks at when you usually complete tasks (from the last couple of weeks) and identifies a 2-hour “prime” window. Completing tasks in that window earns you a small XP bonus (e.g. 10% extra).</li>
            <li><strong>What is “recovery only”?</strong> When your load is very high or the app detects you’re close to burnout, it may show only recovery-style missions (rest, reflection, light movement) until you’re in a better place.</li>
            <li><strong>What does performance rank S/A/B/C mean?</strong> The app scores each completion (0–100) using things like finishing on time, matching your energy, and recent consistency. S is highest (e.g. 90+), then A, B, C. Higher ranks give a small XP boost.</li>
            <li><strong>Can I use the app offline?</strong> Yes. The app works offline; some actions may be saved and synced when you’re back online. You’ll see an offline page when there’s no connection.</li>
            <li><strong>Why do rewards or difficulty sometimes change?</strong> The app sometimes adjusts based on your identity drift, load forecast, weekly mode, and similar factors—so rewards or suggested difficulty can shift slightly to keep things balanced.</li>
          </ul>
        </AccordionSection>

        <AccordionSection id="undocumented" title="25. For the Curious" sectionNum={25}>
          <p>A few more things the app does behind the scenes—no need to remember these; they’re here if you’re interested.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Recovery</strong> — Completing recovery-style tasks can slightly improve the next day’s suggested load and energy. Marking a day as a rest day protects your streak so that zero completions that day don’t count against you.</li>
            <li><strong>Identity &amp; drift</strong> — The app tracks how your behavior aligns with your goals and may show “drift” on the Strategy page. Your reputation can show up when you level up.</li>
            <li><strong>Economy</strong> — Completing tasks can earn discipline points, focus credits, and momentum boosters; you may see an economy badge on the dashboard.</li>
            <li><strong>Budget discipline</strong> — The Budget page tracks how well you stick to your plan and can show a discipline index and weekly performance.</li>
            <li><strong>Assistant</strong> — The AI assistant uses your goals, tasks, and context to suggest actions and help you add tasks, expenses, or learning.</li>
            <li><strong>Mission chains</strong> — Finishing linked tasks in a chain can give you an extra economy reward.</li>
          </ul>
        </AccordionSection>
      </div>

      <p className="mt-8 text-center text-[11px] text-[var(--text-muted)]" aria-label="Help last updated">
        Help bijgewerkt: {HELP_LAST_UPDATED}
      </p>

      {showBackToContents && (
        <button
          type="button"
          onClick={() => document.getElementById("help-toc")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="help-back-btn fixed bottom-20 right-4 z-10 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]/50 transition-all"
          aria-label="Back to table of contents"
        >
          ↑ Contents
        </button>
      )}
    </div>
  );
}
