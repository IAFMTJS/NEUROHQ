-- Extra metadata voor avoidance_tracker zodat we max 1 forced confrontatie-missie per week kunnen afdwingen.

alter table public.avoidance_tracker
  add column if not exists last_forced_at timestamptz;

alter table public.avoidance_tracker
  add column if not exists last_forced_level smallint
    check (last_forced_level is null or last_forced_level between 1 and 3);

comment on column public.avoidance_tracker.last_forced_at is 'Laatste moment waarop een forced confrontation mission voor deze tag is geselecteerd.';
comment on column public.avoidance_tracker.last_forced_level is 'Escalatieniveau (1=Zachte Spiegel, 2=Patroon Benoemen, 3=Identiteit Confrontatie) voor de laatste forced missie.';

