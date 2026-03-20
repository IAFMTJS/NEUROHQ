-- Backfill legacy tasks so brain-status driven selection has consistent task DNA.
-- Safety: only fills NULL fields; existing user-edited values are preserved.

-- 1) Focus requirement
update public.tasks
set focus_required = case
  when lower(coalesce(title, '')) similar to '%(study|learn|admin|plan|write|project|werk|rapport)%' then 7
  when lower(coalesce(title, '')) similar to '%(clean|opruim|wash|poets|kuis|walk|run|gym|workout)%' then 4
  when lower(coalesce(title, '')) similar to '%(rest|recover|pause|break|chill|relax)%' then 3
  else 5
end
where focus_required is null;

-- 2) Mental load
update public.tasks
set mental_load = case
  when lower(coalesce(title, '')) similar to '%(study|learn|admin|plan|write|project|werk|rapport)%' then 8
  when lower(coalesce(title, '')) similar to '%(rest|recover|pause|break|chill|relax)%' then 2
  when lower(coalesce(title, '')) similar to '%(clean|opruim|wash|poets|kuis|walk|run|gym|workout)%' then 3
  else 5
end
where mental_load is null;

-- 3) Social load (legacy field used in several engines)
update public.tasks
set social_load = case
  when lower(coalesce(title, '')) similar to '%(call|meeting|social|vriend|family|team)%' then 7
  when lower(coalesce(title, '')) similar to '%(rest|recover|pause|break|chill|relax)%' then 2
  when lower(coalesce(title, '')) similar to '%(clean|opruim|wash|poets|kuis|walk|run|gym|workout)%' then 3
  else 5
end
where social_load is null;

-- 4) Base XP from inferred intensity/duration archetype
update public.tasks
set base_xp = case
  when lower(coalesce(title, '')) similar to '%(gym|workout|run|sprint)%' then 100
  when lower(coalesce(title, '')) similar to '%(study|learn|admin|plan|write|project|werk|rapport)%' then 95
  when lower(coalesce(title, '')) similar to '%(clean|opruim|wash|poets|kuis)%' then 90
  when lower(coalesce(title, '')) similar to '%(rest|recover|pause|break|chill|relax)%' then 50
  else 80
end
where base_xp is null;

-- 5) Domain alignment
update public.tasks
set domain = case
  when lower(coalesce(title, '')) similar to '%(study|learn|course|taal|language|read|boek)%' then 'learning'
  when lower(coalesce(title, '')) similar to '%(gym|workout|run|walk|health|sleep)%' then 'health'
  when lower(coalesce(title, '')) similar to '%(budget|invoice|factuur|money|finance)%' then 'business'
  else 'discipline'
end
where domain is null;

-- 6) Mission intent (must match tasks constraint)
update public.tasks
set mission_intent = case
  when lower(coalesce(title, '')) similar to '%(rest|recover|pause|break|chill|relax)%' then 'recovery'
  when lower(coalesce(title, '')) similar to '%(study|learn|course|taal|language|read|boek)%' then 'alignment'
  when lower(coalesce(title, '')) similar to '%(experiment|test|try)%' then 'experiment'
  else 'discipline'
end
where mission_intent is null;

