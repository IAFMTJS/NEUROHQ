-- NEUROHQ — Sample quotes (id 1–365 = day of year)
-- Full seed: run `npm run seed:quotes` to populate from 365_Philosophical_Quotes_Structured.txt

insert into public.quotes (id, author_name, era, topic, quote_text) values
(1, 'Marcus Aurelius', 'Ancient Rome (121–180 AD)', 'virtue', 'Desire without discipline becomes a chain.'),
(2, 'Plato', 'Ancient Greece (427–347 BC)', 'ego', 'He who seeks truth must risk loneliness.'),
(3, 'Marcus Aurelius', 'Ancient Rome (121–180 AD)', 'love', 'What you avoid controls you more than what you confront.')
on conflict (id) do update set
  author_name = excluded.author_name,
  era = excluded.era,
  topic = excluded.topic,
  quote_text = excluded.quote_text;
