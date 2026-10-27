import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * מריץ את מיגרציות Supabase על Postgres אמיתי (PGlite) עם תחליפים מינימליים ל-auth ול-storage,
 * ובודק טבלאות, אילוצים, מחיקות שרשרת ו-RLS (בידוד בין משתמשים).
 */
const REQUIRED_TABLES = [
  "profiles", "subjects", "topics", "homework", "exams", "exam_questions", "exam_attempts", "answer_submissions",
  "study_materials", "study_notes", "flashcards", "flashcard_reviews", "calendar_events", "study_sessions",
  "ai_conversations", "ai_messages", "achievements",
];

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
let db: PGlite;

const asUser = async (uid: string) => {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
};
const asAdmin = async () => {
  await db.exec("reset role");
};

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create role anon; create role authenticated;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid default gen_random_uuid() primary key, bucket_id text, name text);
    alter table storage.objects enable row level security; -- ב-Supabase האמיתי RLS מופעל כברירת מחדל
    create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
    grant usage on schema auth, storage, public to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `);
  for (const f of ["0001_schema.sql", "0002_rls.sql", "0003_storage_and_account.sql"]) {
    await db.exec(readFileSync(join(process.cwd(), "supabase/migrations", f), "utf8"));
  }
  await db.exec(`
    grant select, insert, update, delete on all tables in schema public to authenticated;
    grant select, insert, update, delete on all tables in schema storage to authenticated;
    insert into auth.users (id) values ('${A}'), ('${B}');
  `);
});

describe("סכימת Supabase", () => {
  it("כל הטבלאות הנדרשות קיימות", async () => {
    const r = await db.query<{ table_name: string }>("select table_name from information_schema.tables where table_schema = 'public'");
    const names = r.rows.map((x) => x.table_name);
    for (const t of REQUIRED_TABLES) expect(names, t).toContain(t);
  });

  it("RLS מופעל (ומאולץ) בכל טבלאות הנתונים, ויש מדיניות לכל אחת", async () => {
    const r = await db.query<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }>(
      "select relname, relrowsecurity, relforcerowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r'",
    );
    expect(r.rows.length).toBeGreaterThanOrEqual(REQUIRED_TABLES.length);
    for (const t of r.rows) {
      expect(t.relrowsecurity, `${t.relname} rls`).toBe(true);
      expect(t.relforcerowsecurity, `${t.relname} force`).toBe(true);
    }
    const pol = await db.query<{ tablename: string }>("select distinct tablename from pg_policies where schemaname = 'public'");
    expect(pol.rows.length).toBe(r.rows.length);
  });

  it("בידוד משתמשים: משתמש לא רואה ולא משנה נתונים של אחר", async () => {
    await asUser(A);
    await db.exec(`insert into public.profiles (id, display_name, grade) values ('${A}', 'א', 8)`);
    await db.exec(`insert into public.subjects (id, name) values ('aaaaaaaa-0000-4000-8000-000000000001', 'מתמטיקה')`);
    await db.exec(`insert into public.homework (id, subject_id, title, due_date) values ('aaaaaaaa-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'תרגיל', '2026-03-10')`);

    await asUser(B);
    expect((await db.query("select * from public.subjects")).rows).toHaveLength(0);
    expect((await db.query("select * from public.homework")).rows).toHaveLength(0);
    expect((await db.query("select * from public.profiles")).rows).toHaveLength(0);
    // ניסיון עדכון/מחיקה של רשומת משתמש אחר משפיע על 0 שורות
    const upd = await db.query("update public.homework set title = 'פריצה' returning id");
    expect(upd.rows).toHaveLength(0);
    const del = await db.query("delete from public.subjects returning id");
    expect(del.rows).toHaveLength(0);
    // ניסיון להכניס רשומה בשם משתמש אחר נדחה על ידי RLS
    await expect(db.exec(`insert into public.subjects (id, user_id, name) values ('bbbbbbbb-0000-4000-8000-000000000001', '${A}', 'מתחזה')`)).rejects.toThrow(/row-level security/i);
    // ניסיון "להעביר" רשומה של עצמי למשתמש אחר נדחה
    await db.exec(`insert into public.subjects (id, name) values ('bbbbbbbb-0000-4000-8000-000000000002', 'שלי')`);
    await expect(db.exec(`update public.subjects set user_id = '${A}' where id = 'bbbbbbbb-0000-4000-8000-000000000002'`)).rejects.toThrow(/row-level security/i);

    await asUser(A);
    expect((await db.query("select * from public.homework")).rows).toHaveLength(1);
  });

  it("אין גישה לתפקיד anon", async () => {
    await db.exec("set role anon");
    await expect(db.query("select * from public.subjects")).rejects.toThrow(/permission denied/i);
    await asAdmin();
  });

  it("אילוצי תקינות: פרופיל פרטי, תחום ציונים, XP ייחודי, נקודות תקינות", async () => {
    await asUser(B);
    await expect(db.exec(`insert into public.profiles (id, display_name, grade, is_private) values ('${B}', 'ב', 8, false)`)).rejects.toThrow(/check/i);
    await expect(db.exec(`insert into public.profiles (id, display_name, grade) values ('${B}', 'ב', 99)`)).rejects.toThrow(/check/i);
    await db.exec(`insert into public.profiles (id, display_name, grade) values ('${B}', 'ב', 8)`);
    await db.exec(`insert into public.xp_events (id, dedupe_key, amount) values ('cccccccc-0000-4000-8000-000000000001', 'hw:1', 15)`);
    await expect(db.exec(`insert into public.xp_events (id, dedupe_key, amount) values ('cccccccc-0000-4000-8000-000000000002', 'hw:1', 15)`)).rejects.toThrow(/unique/i);
    await expect(db.exec(`insert into public.xp_events (id, dedupe_key, amount) values ('cccccccc-0000-4000-8000-000000000003', 'x', 99999)`)).rejects.toThrow(/check/i);
    await expect(db.exec(`insert into public.homework (id, title, due_date, priority) values ('cccccccc-0000-4000-8000-000000000004', 'x', '2026-01-01', 'urgent')`)).rejects.toThrow(/check/i);
    await expect(db.exec(`insert into public.practice_results (id, topic, correct, total, source, at) values ('cccccccc-0000-4000-8000-000000000005', 't', 5, 3, 'exam', now())`)).rejects.toThrow(/check/i);
  });

  it("מחיקת מקצוע: נושאים ומבחנים נמחקים בשרשור, שיעורי בית נשארים ללא שיוך", async () => {
    await asUser(A);
    await db.exec(`
      insert into public.topics (id, subject_id, name) values ('aaaaaaaa-0000-4000-8000-000000000010', 'aaaaaaaa-0000-4000-8000-000000000001', 'שברים');
      insert into public.exams (id, subject_id, title, date) values ('aaaaaaaa-0000-4000-8000-000000000011', 'aaaaaaaa-0000-4000-8000-000000000001', 'מבחן', '2026-04-01');
      insert into public.exam_questions (id, exam_id, subject_id, type, prompt, answer_key) values ('aaaaaaaa-0000-4000-8000-000000000012', 'aaaaaaaa-0000-4000-8000-000000000011', 'aaaaaaaa-0000-4000-8000-000000000001', 'tf', '?', 'true');
      insert into public.exam_attempts (id, exam_id, subject_id, title, started_at) values ('aaaaaaaa-0000-4000-8000-000000000013', 'aaaaaaaa-0000-4000-8000-000000000011', 'aaaaaaaa-0000-4000-8000-000000000001', 't', now());
      insert into public.answer_submissions (id, attempt_id, question_id, response, points) values ('aaaaaaaa-0000-4000-8000-000000000014', 'aaaaaaaa-0000-4000-8000-000000000013', 'aaaaaaaa-0000-4000-8000-000000000012', 'true', 1);
    `);
    await db.exec(`delete from public.subjects where id = 'aaaaaaaa-0000-4000-8000-000000000001'`);
    for (const t of ["topics", "exams", "exam_questions", "exam_attempts", "answer_submissions"]) {
      expect((await db.query(`select 1 from public.${t}`)).rows, t).toHaveLength(0);
    }
    const hw = await db.query<{ subject_id: string | null }>("select subject_id from public.homework");
    expect(hw.rows).toHaveLength(1);
    expect(hw.rows[0].subject_id).toBeNull();
  });

  it("מחיקת חשבון (delete_my_account) מוחקת את כל נתוני המשתמש ורק שלו", async () => {
    await asUser(A);
    await db.exec(`insert into public.flashcards (id, front, back, due) values ('aaaaaaaa-0000-4000-8000-000000000020', 'ש', 'ת', '2026-03-10')`);
    await db.exec(`select public.delete_my_account()`);
    await asAdmin();
    expect((await db.query("select * from auth.users where id = $1", [A])).rows).toHaveLength(0);
    for (const t of ["profiles", "homework", "flashcards", "subjects"]) {
      expect((await db.query(`select 1 from public.${t} where ${t === "profiles" ? "id" : "user_id"} = $1`, [A])).rows, t).toHaveLength(0);
    }
    expect((await db.query("select * from public.profiles where id = $1", [B])).rows).toHaveLength(1);
  });

  it("מדיניות האחסון מחילה הרשאה לפי תיקיית המשתמש", async () => {
    await asUser(B);
    await db.exec(`insert into storage.objects (bucket_id, name) values ('study-files', '${B}/file1')`);
    await expect(db.exec(`insert into storage.objects (bucket_id, name) values ('study-files', '${A}/file2')`)).rejects.toThrow(/row-level security/i);
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(1);
    await asAdmin();
    const bucket = await db.query<{ public: boolean }>("select public from storage.buckets where id = 'study-files'");
    expect(bucket.rows[0].public).toBe(false);
  });
});
