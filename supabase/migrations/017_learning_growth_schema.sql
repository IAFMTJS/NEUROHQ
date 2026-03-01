-- Learning & Growth enhancements: configurable target, session links, types, options archive

-- Users: configurable weekly learning target (minutes)
alter table public.users
  add column if not exists weekly_learning_target_minutes smallint default 60;

comment on column public.users.weekly_learning_target_minutes is 'Weekly learning minutes target (default 60).';

-- Learning sessions: link to education option, learning type, optional book
alter table public.learning_sessions
  add column if not exists education_option_id uuid references public.education_options(id) on delete set null,
  add column if not exists learning_type text default 'general',
  add column if not exists monthly_book_id uuid references public.monthly_books(id) on delete set null;

comment on column public.learning_sessions.education_option_id is 'Optional link to education option when logging from a path.';
comment on column public.learning_sessions.learning_type is 'general | reading | course | podcast | video';
comment on column public.learning_sessions.monthly_book_id is 'When type is reading, optional link to monthly book.';

alter table public.learning_sessions
  drop constraint if exists learning_sessions_learning_type_check;
alter table public.learning_sessions
  add constraint learning_sessions_learning_type_check check (learning_type in ('general', 'reading', 'course', 'podcast', 'video'));

-- Education options: archived and category
alter table public.education_options
  add column if not exists archived_at timestamptz,
  add column if not exists category text;

comment on column public.education_options.archived_at is 'When set, option is archived/done and hidden from active list.';
comment on column public.education_options.category is 'Optional category/tag (e.g. Programming, Language).';

-- Monthly books: optional reading goal (pages per day or chapters per week)
alter table public.monthly_books
  add column if not exists pages_per_day smallint,
  add column if not exists chapters_per_week numeric(3,1),
  add column if not exists slot smallint not null default 1;

comment on column public.monthly_books.pages_per_day is 'Optional daily reading goal (pages).';
comment on column public.monthly_books.chapters_per_week is 'Optional weekly goal (chapters).';
comment on column public.monthly_books.slot is 'Slot for multiple books per month (1-based).';

-- Allow multiple books per month: drop unique (user, year, month), use (user, year, month, slot)
alter table public.monthly_books drop constraint if exists monthly_books_user_id_year_month_key;
create unique index if not exists idx_monthly_books_user_year_month_slot
  on public.monthly_books(user_id, year, month, slot);
