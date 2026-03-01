-- Quotes are now in-code (lib/quotes-data.json + lib/quotes.ts). Drop the table.
drop table if exists public.quotes;
