-- Monthly books: total pages (for check-ins) and pages read so far (weekly update)
alter table public.monthly_books
  add column if not exists total_pages smallint,
  add column if not exists pages_read smallint,
  add column if not exists pages_updated_at timestamptz;

comment on column public.monthly_books.total_pages is 'Total pages in the book (for progress and check-ins).';
comment on column public.monthly_books.pages_read is 'Pages read so far (update weekly).';
comment on column public.monthly_books.pages_updated_at is 'Last time pages_read was updated.';
