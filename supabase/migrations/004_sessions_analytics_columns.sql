-- Optional analytics columns for sessions (for when we persist transcript/AI usage per call)
alter table public.sessions
  add column if not exists transcript_preview text,
  add column if not exists suggestions_count int default 0,
  add column if not exists follow_up_count int default 0;
