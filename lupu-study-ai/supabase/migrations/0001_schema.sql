-- LUPU Study AI – סכימת נתונים (שלב ב')
-- כל הרשומות שייכות למשתמש (user_id) ומזהים נוצרים בצד הלקוח (uuid), כך שסנכרון מקומי↔ענן הוא upsert פשוט.


-- ───────────── profiles ─────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  grade int not null check (grade between 1 and 12),
  goals text[] not null default '{}',
  daily_minutes int not null default 30 check (daily_minutes between 5 and 600),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  onboarded boolean not null default false,
  -- פרופיל קטין פרטי כברירת מחדל: אין פרופיל ציבורי, ואי אפשר לכבות את הדגל
  is_private boolean not null default true check (is_private),
  created_at timestamptz not null default now()
);

-- ───────────── subjects / topics ─────────────
create table public.subjects (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text,
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default 'BookOpen',
  color text not null default 'violet',
  custom boolean not null default false,
  created_at timestamptz not null default now()
);
create index subjects_user_idx on public.subjects (user_id);

create table public.topics (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  custom boolean not null default false,
  created_at timestamptz not null default now()
);
create index topics_user_idx on public.topics (user_id);
create index topics_subject_idx on public.topics (subject_id);

-- ───────────── homework ─────────────
create table public.homework (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  due_date date not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  done boolean not null default false,
  done_at timestamptz,
  attachment_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  check (done or done_at is null)
);
create index homework_user_due_idx on public.homework (user_id, due_date);
create index homework_subject_idx on public.homework (subject_id);

-- ───────────── exams ─────────────
create table public.exams (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  date date not null,
  topics text[] not null default '{}',
  material_ids uuid[] not null default '{}',
  minutes_per_day int not null default 30 check (minutes_per_day between 10 and 300),
  created_at timestamptz not null default now()
);
create index exams_user_date_idx on public.exams (user_id, date);
create index exams_subject_idx on public.exams (subject_id);

create table public.exam_questions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exam_id uuid references public.exams (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  topic text not null default '',
  type text not null check (type in ('mcq', 'open', 'tf', 'fill')),
  prompt text not null check (char_length(prompt) between 1 and 3000),
  options text[] not null default '{}',
  answer_key text not null,
  rubric text not null default '',
  explanation text not null default '',
  difficulty int not null default 2 check (difficulty between 1 and 3),
  source text not null default 'manual' check (source in ('manual', 'ai')),
  created_at timestamptz not null default now()
);
create index exam_questions_user_idx on public.exam_questions (user_id);
create index exam_questions_exam_idx on public.exam_questions (exam_id);
create index exam_questions_subject_idx on public.exam_questions (subject_id);

create table public.exam_attempts (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exam_id uuid references public.exams (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null,
  question_ids uuid[] not null default '{}',
  started_at timestamptz not null,
  finished_at timestamptz,
  timer_seconds int check (timer_seconds is null or timer_seconds > 0),
  score_percent numeric(5, 2) check (score_percent is null or score_percent between 0 and 100),
  graded_count int not null default 0 check (graded_count >= 0),
  pending_count int not null default 0 check (pending_count >= 0)
);
create index exam_attempts_user_idx on public.exam_attempts (user_id, started_at desc);
create index exam_attempts_exam_idx on public.exam_attempts (exam_id);

create table public.answer_submissions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  attempt_id uuid not null references public.exam_attempts (id) on delete cascade,
  question_id uuid not null,
  response text not null default '',
  correct boolean,
  -- 0..1; null = ממתין להערכה (שאלה פתוחה)
  points numeric(4, 3) check (points is null or points between 0 and 1),
  assessment jsonb,
  self_assessed boolean not null default false
);
create index answer_submissions_user_idx on public.answer_submissions (user_id);
create index answer_submissions_attempt_idx on public.answer_submissions (attempt_id);

-- ───────────── חומרים וסיכומים ─────────────
create table public.study_materials (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  topic text not null default '',
  title text not null check (char_length(title) between 1 and 160),
  kind text not null check (kind in ('pdf', 'image', 'text')),
  mime text not null default '',
  size bigint not null default 0 check (size >= 0),
  pages jsonb not null default '[]'::jsonb,
  extraction text not null default 'ok' check (extraction in ('ok', 'none', 'pending', 'not_applicable')),
  has_blob boolean not null default false,
  created_at timestamptz not null default now()
);
create index study_materials_user_idx on public.study_materials (user_id);
create index study_materials_subject_idx on public.study_materials (subject_id);

create table public.study_notes (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  kind text not null check (kind in ('short', 'detailed', 'bullets', 'keywords', 'examSheet', 'qa', 'manual')),
  content text not null default '',
  material_ids uuid[] not null default '{}',
  ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index study_notes_user_idx on public.study_notes (user_id);
create index study_notes_subject_idx on public.study_notes (subject_id);

-- ───────────── כרטיסיות ─────────────
create table public.flashcards (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  topic text not null default '',
  front text not null check (char_length(front) between 1 and 600),
  back text not null check (char_length(back) between 1 and 1200),
  ease numeric(4, 2) not null default 2.3 check (ease between 1.3 and 2.8),
  interval_days int not null default 0 check (interval_days >= 0),
  due date not null,
  reps int not null default 0 check (reps >= 0),
  lapses int not null default 0 check (lapses >= 0),
  attempts int not null default 0 check (attempts >= 0),
  successes int not null default 0 check (successes >= 0 and successes <= attempts),
  last_reviewed_at timestamptz,
  source text not null default 'manual' check (source in ('manual', 'ai')),
  created_at timestamptz not null default now()
);
create index flashcards_user_due_idx on public.flashcards (user_id, due);
create index flashcards_subject_idx on public.flashcards (subject_id);

create table public.flashcard_reviews (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null references public.flashcards (id) on delete cascade,
  known boolean not null,
  at timestamptz not null,
  interval_after int not null default 0 check (interval_after >= 0)
);
create index flashcard_reviews_user_idx on public.flashcard_reviews (user_id, at desc);
create index flashcard_reviews_card_idx on public.flashcard_reviews (card_id);

-- ───────────── יומן, מערכת שעות, מפגשים ─────────────
create table public.calendar_events (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('exam', 'homework', 'project', 'review', 'session')),
  title text not null check (char_length(title) between 1 and 120),
  subject_id uuid references public.subjects (id) on delete set null,
  date date not null,
  start_time text not null default '' check (start_time = '' or start_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  end_time text not null default '' check (end_time = '' or end_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  notes text not null default '',
  ref_id uuid,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index calendar_events_user_date_idx on public.calendar_events (user_id, date);
create index calendar_events_ref_idx on public.calendar_events (ref_id);

create table public.timetable_slots (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time text not null check (start_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  end_time text not null check (end_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  subject_id uuid references public.subjects (id) on delete set null,
  label text not null default '',
  room text not null default ''
);
create index timetable_slots_user_idx on public.timetable_slots (user_id, weekday);

create table public.study_sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  started_at timestamptz not null,
  minutes numeric(7, 1) not null check (minutes >= 1 and minutes <= 1440),
  planned_minutes int not null default 0 check (planned_minutes >= 0),
  kind text not null default 'focus' check (kind in ('focus', 'manual')),
  completed boolean not null default false,
  day date not null
);
create index study_sessions_user_day_idx on public.study_sessions (user_id, day);

create table public.practice_results (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  topic text not null default '',
  correct numeric(6, 2) not null check (correct >= 0),
  total int not null check (total > 0),
  difficulty int not null default 2 check (difficulty between 1 and 3),
  source text not null check (source in ('exam', 'flashcards', 'tutor', 'scan')),
  at timestamptz not null,
  check (correct <= total)
);
create index practice_results_user_idx on public.practice_results (user_id, at desc);
create index practice_results_topic_idx on public.practice_results (user_id, subject_id, topic);

-- ───────────── מורה AI ─────────────
create table public.ai_conversations (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  subject_id uuid references public.subjects (id) on delete set null,
  topic text not null default '',
  mode text not null default 'explain' check (mode in ('explain', 'practice', 'exam')),
  level text not null default 'standard' check (level in ('simple', 'standard', 'advanced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_conversations_user_idx on public.ai_conversations (user_id, updated_at desc);
create index ai_conversations_subject_idx on public.ai_conversations (subject_id);

create table public.ai_messages (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '' check (char_length(content) <= 40000),
  image_ids uuid[] not null default '{}',
  citations jsonb not null default '[]'::jsonb,
  is_error boolean not null default false,
  created_at timestamptz not null default now()
);
create index ai_messages_conv_idx on public.ai_messages (conversation_id, created_at);
create index ai_messages_user_idx on public.ai_messages (user_id);

create table public.saved_exercises (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  question_text text not null,
  detected text not null default '',
  hint text not null default '',
  steps text[] not null default '{}',
  final_answer text not null default '',
  image_id uuid,
  created_at timestamptz not null default now()
);
create index saved_exercises_user_idx on public.saved_exercises (user_id);

-- ───────────── גיימיפיקציה ויעדים ─────────────
create table public.achievements (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, key)
);

-- אילוץ ה-unique על dedupe_key אוכף גם בשרת שאי אפשר לצבור XP פעמיים על אותה פעולה
create table public.xp_events (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dedupe_key text not null,
  amount int not null check (amount > 0 and amount <= 200),
  reason text not null default '',
  at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);
create index xp_events_user_idx on public.xp_events (user_id, at desc);

create table public.personal_goals (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  metric text not null check (metric in ('studyMinutesWeek', 'practiceWeek', 'cardsWeek')),
  target int not null check (target > 0 and target <= 100000),
  created_at timestamptz not null default now()
);
create index personal_goals_user_idx on public.personal_goals (user_id);
