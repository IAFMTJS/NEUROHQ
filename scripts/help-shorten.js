const fs = require("fs");
const path = "app/(dashboard)/help/page.tsx";
let s = fs.readFileSync(path, "utf8");

// Goal section
const goalStart = s.indexOf('<AccordionSection id="goal"');
let depth = 0;
let i = goalStart;
while (i < s.length) {
  if (s.substring(i, i + 25) === "<AccordionSection") depth++;
  if (s.substring(i, i + 19) === "</AccordionSection>") {
    depth--;
    if (depth === 0) {
      const goalEnd = i + 19;
      const newGoal = `        <AccordionSection id="goal" title="2. What NEUROHQ Is For" sectionNum={2}>
          <HelpAtAGlance items={["One app for tasks, energy, budget, learning", "Adapts to low energy / high load", "Theme and motion in Settings"]} />
          <p>The one app you open every day. It <strong>adapts</strong>: low energy → fewer or lighter missions; high load → more recovery options.</p>
          <ul className="list-disc pl-5 space-y-0.5 text-sm">
            <li><strong>Tasks</strong> — 2–4 suggested missions from your morning check-in</li>
            <li><strong>XP</strong> — More when energy matches the task</li>
            <li><strong>Budget</strong> — Log income/expenses, goals, freeze on impulse buys</li>
            <li><strong>Growth</strong> — Learning focus, weekly target, reflection</li>
            <li><strong>Strategy</strong> — Quarterly theme and alignment</li>
            <li><strong>Insight</strong> — Patterns, streaks, progress</li>
          </ul>
        </AccordionSection>
`;
      s = s.substring(0, goalStart) + newGoal + s.substring(goalEnd);
      break;
    }
  }
  i++;
}

// Philosophy section
const philStart = s.indexOf('<AccordionSection id="philosophy"');
depth = 0;
i = philStart;
while (i < s.length) {
  if (s.substring(i, i + 25) === "<AccordionSection") depth++;
  if (s.substring(i, i + 19) === "</AccordionSection>") {
    depth--;
    if (depth === 0) {
      const philEnd = i + 19;
      const newPhil = `        <AccordionSection id="philosophy" title="3. How the App Thinks" sectionNum={3}>
          <HelpAtAGlance items={["Critical first, then High impact, then Growth", "Adjusts, does not punish", "Prime window = extra XP"]} />
          <p><strong>Order:</strong> Streak at risk → Critical tasks first. Then High impact (big XP) and Growth boost.</p>
          <p><strong>Gentle:</strong> Low energy or inactive? Fewer missions or less XP until you are back—no guilt.</p>
          <p><strong>Rewards:</strong> Streak, level, achievements. Complete in your prime window (best 2 hours) for a bit more XP. Variety rewarded; same task type all day = slightly less XP.</p>
        </AccordionSection>
`;
      s = s.substring(0, philStart) + newPhil + s.substring(philEnd);
      break;
    }
  }
  i++;
}

// Dashboard: replace block from first <li>Streak through </HelpTip> before RelatedSections
const dashboardSection = s.indexOf('<AccordionSection id="dashboard"');
const relatedDashboard = s.indexOf('<RelatedSections ids={["stats", "missions", "progression-loop"]} />');
const chunk = s.substring(dashboardSection, relatedDashboard);
const streakLi = chunk.indexOf("<li><strong>Streak</strong>");
const startDashboardReplace = dashboardSection + streakLi;
const helpTipEnd = s.indexOf("</HelpTip>", startDashboardReplace) + 9;
const toReplaceDashboard = s.substring(
  startDashboardReplace,
  helpTipEnd
);
const newDashboardChunk = `            <li><strong>Streak</strong> — Days in a row with at least one task; "streak at risk" if you missed yesterday.</li>
            <li><strong>Today's missions</strong> — Critical / High impact / Growth boost.</li>
            <li><strong>Heatmap</strong> — Which days you completed tasks.</li>
          </ul>
          <HelpTip>Brain status first each day = suggested missions and fair rewards.</HelpTip>
`;
if (toReplaceDashboard.includes("Streak") && toReplaceDashboard.includes("HelpExample")) {
  s = s.substring(0, startDashboardReplace) + newDashboardChunk + s.substring(helpTipEnd);
  console.log("Dashboard section shortened");
}

fs.writeFileSync(path, s);
console.log("Goal, Philosophy, and Dashboard sections updated");
