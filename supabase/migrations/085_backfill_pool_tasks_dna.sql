-- Eenmalige backfill: MasterPoolAuto / MasterPoolBonus taken krijgen dezelfde DNA-velden
-- als nieuwe inserts (task_type, intensity, duration_minutes, task_tags, cognitive_load).
-- Alleen waar velden nog NULL zijn — bestaande waarden blijven.
-- cognitive_load in DB: 0.1–1 (zie tasks_cognitive_load_check); mental_load is 1–10 → schaal /10.
-- Titels: zelfde regex-hints als lib/task-presets.ts classifyTaskPreset (study/clean/workout → default recovery).

update public.tasks t
set
  cognitive_load = coalesce(
    t.cognitive_load,
    case
      when t.mental_load is not null then
        least(1::numeric, greatest(0.1::numeric, round((t.mental_load::numeric / 10.0), 2)))
      else null
    end
  ),
  task_type = coalesce(
    t.task_type,
    case
      when lower(coalesce(t.title, '')) ~ '(study|learn|stud|leren)' then 'mental'
      when lower(coalesce(t.title, '')) ~ '(clean|opruim|wash|poets|kuis)' then 'physical'
      when lower(coalesce(t.title, '')) ~ '(gym|workout|train|run|fitness)' then 'physical'
      else 'recovery'
    end
  ),
  intensity = coalesce(
    t.intensity,
    case
      when lower(coalesce(t.title, '')) ~ '(study|learn|stud|leren)' then 75
      when lower(coalesce(t.title, '')) ~ '(clean|opruim|wash|poets|kuis)' then 60
      when lower(coalesce(t.title, '')) ~ '(gym|workout|train|run|fitness)' then 85
      else 20
    end::smallint
  ),
  duration_minutes = coalesce(
    t.duration_minutes,
    case
      when lower(coalesce(t.title, '')) ~ '(study|learn|stud|leren)' then 60
      when lower(coalesce(t.title, '')) ~ '(clean|opruim|wash|poets|kuis)' then 45
      when lower(coalesce(t.title, '')) ~ '(gym|workout|train|run|fitness)' then 60
      else 30
    end
  ),
  task_tags = coalesce(t.task_tags, '[]'::jsonb)
where t.psychology_label in ('MasterPoolAuto', 'MasterPoolBonus')
  and t.deleted_at is null
  and (
    t.cognitive_load is null
    or t.task_type is null
    or t.intensity is null
    or t.duration_minutes is null
    or t.task_tags is null
  );
