-- LUPU Study AI – Row Level Security
-- כל משתמש יכול לקרוא ולשנות אך ורק רשומות ששייכות לו. אין גישה אנונימית לשום טבלה.

do $$
declare
  t text;
begin
  foreach t in array array[
    'subjects', 'topics', 'homework', 'exams', 'exam_questions', 'exam_attempts', 'answer_submissions',
    'study_materials', 'study_notes', 'flashcards', 'flashcard_reviews', 'calendar_events', 'timetable_slots',
    'study_sessions', 'practice_results', 'ai_conversations', 'ai_messages', 'saved_exercises',
    'achievements', 'xp_events', 'personal_goals'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_owner', t
    );
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
create policy profiles_owner on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ללא הרשאות לתפקיד anon
revoke all on all tables in schema public from anon;
