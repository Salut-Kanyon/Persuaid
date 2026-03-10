-- Full transcript and coaching analysis for Analyze page
alter table public.sessions
  add column if not exists transcript_full text,
  add column if not exists analysis text;
