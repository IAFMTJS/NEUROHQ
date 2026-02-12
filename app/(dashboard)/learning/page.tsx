import { getWeekBounds } from "@/lib/utils/learning";
import { getWeeklyMinutes, getLearningStreak, getEducationOptions } from "@/app/actions/learning";
import { LearningProgress } from "@/components/LearningProgress";
import { AddLearningSessionForm } from "@/components/AddLearningSessionForm";
import { AddEducationOptionForm } from "@/components/AddEducationOptionForm";
import { EducationOptionsList } from "@/components/EducationOptionsList";

export default async function LearningPage() {
  const today = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds(today);
  const [minutes, streak, options] = await Promise.all([
    getWeeklyMinutes(weekStart, weekEnd),
    getLearningStreak(),
    getEducationOptions(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neuro-silver">Learning</h1>

      <section>
        <LearningProgress
          minutes={minutes}
          target={60}
          streak={streak}
          weekStart={weekStart}
          weekEnd={weekEnd}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neuro-silver">Log session</h2>
        <AddLearningSessionForm date={today.toISOString().slice(0, 10)} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neuro-silver">Education options (clarity score)</h2>
        <AddEducationOptionForm />
        <div className="mt-4">
          <EducationOptionsList options={options} />
        </div>
      </section>
    </div>
  );
}
