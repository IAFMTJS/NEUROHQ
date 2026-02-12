import Link from "next/link";

export function StrategyIntro() {
  return (
    <div className="card-modern-accent overflow-hidden p-0">
      <div className="border-b border-neuro-border/80 px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Why set a quarterly strategy?</h2>
      </div>
      <div className="p-4">
        <ul className="space-y-2 text-sm text-neuro-muted leading-relaxed">
          <li>• <strong className="text-neuro-silver">Theme</strong> — One primary focus (e.g. Focus, Health) so decisions are easier.</li>
          <li>• <strong className="text-neuro-silver">Identity</strong> — Who you want to be this quarter; use it when you’re stuck.</li>
          <li>• <strong className="text-neuro-silver">Key results</strong> — 2–4 concrete outcomes so you know when you’re done.</li>
          <li>• <strong className="text-neuro-silver">Savings goal</strong> — Link a goal so your <Link href="/report" className="text-neuro-blue hover:underline">reality report</Link> tracks progress.</li>
        </ul>
      </div>
    </div>
  );
}
