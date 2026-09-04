import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export type Row = Record<string, any>; // SQLite rows are validated at service boundaries.
const globals = globalThis as unknown as { levelupDb?: DatabaseSync; levelupSchemaVersion?: number };
export function db() {
  if (globals.levelupDb) { if (globals.levelupSchemaVersion !== 5) { migrate(globals.levelupDb); globals.levelupSchemaVersion = 5; } return globals.levelupDb; }
  const file = process.env.LEVELUP_DB_PATH || resolve(process.cwd(), 'data', 'levelup.sqlite');
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const connection = new DatabaseSync(file);
  connection.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  migrate(connection);
  globals.levelupDb = connection;
  globals.levelupSchemaVersion = 5;
  return connection;
}
function migrate(connection: DatabaseSync) {
  connection.exec(schema);
  if (!connection.prepare('PRAGMA table_info(game_coach_contexts)').all().some(column => column.name === 'source')) {
    connection.exec("ALTER TABLE game_coach_contexts ADD COLUMN source TEXT NOT NULL DEFAULT 'demo' CHECK(source IN ('user','demo','ai','hint'))");
    connection.exec(`UPDATE game_coach_contexts AS c SET source=CASE
      WHEN (SELECT role FROM ai_coach_messages WHERE id=c.message_id)='user' THEN 'user'
      WHEN (SELECT json_extract(details,'$.source') FROM admin_actions WHERE action='game.coach.usage' AND target_id=c.message_id ORDER BY created_at DESC LIMIT 1)='hint' THEN 'hint'
      WHEN (SELECT is_demo FROM ai_coach_messages WHERE id=c.message_id)=0 THEN 'ai' ELSE 'demo' END`);
  }
}
/** Rate-limit, session and token rows expire but are never read again; sweep them so the file stays small. */
let lastPrune = 0;
export function pruneExpired(force = false) {
  const time = Date.now();
  if (!force && time - lastPrune < 3600000) return;
  lastPrune = time;
  const timestamp = new Date(time).toISOString();
  run('DELETE FROM rate_limits WHERE expires_at<?', time);
  run('DELETE FROM sessions WHERE expires_at<?', timestamp);
  run('DELETE FROM auth_tokens WHERE expires_at<? OR used_at<?', timestamp, new Date(time - 7 * 86400000).toISOString());
  run('DELETE FROM demo_mail WHERE created_at<?', new Date(time - 7 * 86400000).toISOString());
}
export const now = () => new Date().toISOString();
export const id = () => randomUUID();
export const readJson = <T = any>(value: unknown, fallback: T = {} as T): T => { try { return typeof value === 'string' ? JSON.parse(value) : fallback; } catch { return fallback; } };
export function one(sql: string, ...args: any[]): Row | undefined { return db().prepare(sql).get(...args) as Row | undefined; }
export function all(sql: string, ...args: any[]): Row[] { return db().prepare(sql).all(...args) as Row[]; }
export function run(sql: string, ...args: any[]) { return db().prepare(sql).run(...args); }
export function transaction<T>(action: () => T): T { db().exec('BEGIN IMMEDIATE'); try { const result = action(); db().exec('COMMIT'); return result; } catch (error) { db().exec('ROLLBACK'); throw error; } }
export function audit(actor: string | null, action: string, target: string, details: unknown = {}) { run('INSERT INTO admin_actions(id,actor_id,action,target_id,details,created_at) VALUES(?,?,?,?,?,?)', id(), actor, action, target, JSON.stringify(details), now()); }
export function notify(userId: string, he: string, en: string) { run('INSERT INTO notifications(id,user_id,message,created_at) VALUES(?,?,?,?)', id(), userId, JSON.stringify({ he, en }), now()); }

const schema = `
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'learner' CHECK(role IN ('learner','admin')),email_verified INTEGER DEFAULT 0,blocked INTEGER DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,deleted_at TEXT);
CREATE TABLE IF NOT EXISTS profiles(user_id TEXT PRIMARY KEY REFERENCES users(id),display_name TEXT NOT NULL,birth_year INTEGER NOT NULL,preferences TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS auth_tokens(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),kind TEXT NOT NULL,expires_at TEXT NOT NULL,used_at TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS parental_consents(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),parent_email TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',approved_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plans(id TEXT PRIMARY KEY,price REAL NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plan_features(id TEXT PRIMARY KEY,plan_id TEXT NOT NULL REFERENCES plans(id),feature TEXT NOT NULL,value TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(plan_id,feature));
CREATE TABLE IF NOT EXISTS subscriptions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),plan_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',starts_at TEXT NOT NULL,expires_at TEXT NOT NULL,order_id TEXT UNIQUE,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions(user_id,status,expires_at);
CREATE TABLE IF NOT EXISTS learning_paths(id TEXT PRIMARY KEY,title TEXT NOT NULL,category TEXT NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,deleted_at TEXT);
CREATE TABLE IF NOT EXISTS private_path_owners(path_id TEXT PRIMARY KEY REFERENCES learning_paths(id),user_id TEXT NOT NULL REFERENCES users(id),created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS private_paths_user_idx ON private_path_owners(user_id);
CREATE TABLE IF NOT EXISTS path_enrollments(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),path_id TEXT NOT NULL REFERENCES learning_paths(id),skill TEXT,level TEXT NOT NULL,daily_minutes INTEGER NOT NULL,goal TEXT NOT NULL,target_date TEXT NOT NULL,styles TEXT NOT NULL,adaptation TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,path_id));
CREATE INDEX IF NOT EXISTS enrollments_user_idx ON path_enrollments(user_id);
CREATE TABLE IF NOT EXISTS chapters(id TEXT PRIMARY KEY,path_id TEXT NOT NULL REFERENCES learning_paths(id),position INTEGER NOT NULL,title TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS lessons(id TEXT PRIMARY KEY,chapter_id TEXT NOT NULL REFERENCES chapters(id),title TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,lesson_id TEXT NOT NULL REFERENCES lessons(id),data TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS task_submissions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),enrollment_id TEXT NOT NULL REFERENCES path_enrollments(id),task_id TEXT NOT NULL,text TEXT NOT NULL,link TEXT,file_id TEXT,difficulty TEXT NOT NULL,feedback TEXT NOT NULL,xp INTEGER NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,enrollment_id,task_id));
CREATE TABLE IF NOT EXISTS reinforcement_submissions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),enrollment_id TEXT NOT NULL REFERENCES path_enrollments(id),source_task_id TEXT NOT NULL,text TEXT NOT NULL,xp INTEGER NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,enrollment_id,source_task_id));
CREATE TABLE IF NOT EXISTS ai_coach_messages(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),enrollment_id TEXT,role TEXT NOT NULL,content TEXT NOT NULL,is_demo INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS coach_user_idx ON ai_coach_messages(user_id,created_at);
CREATE TABLE IF NOT EXISTS skills(id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS user_skills(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),skill_id TEXT NOT NULL REFERENCES skills(id),mastery REAL NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,skill_id));
CREATE TABLE IF NOT EXISTS xp_events(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),source TEXT NOT NULL,source_id TEXT NOT NULL,xp INTEGER NOT NULL,coins INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,UNIQUE(user_id,source,source_id));
CREATE TABLE IF NOT EXISTS achievements(id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS user_achievements(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),achievement_id TEXT NOT NULL REFERENCES achievements(id),created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,achievement_id));
CREATE TABLE IF NOT EXISTS streaks(user_id TEXT PRIMARY KEY REFERENCES users(id),count INTEGER NOT NULL DEFAULT 0,longest INTEGER NOT NULL DEFAULT 0,last_day TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS friendships(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),friend_id TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,friend_id));
CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL REFERENCES users(id),title TEXT NOT NULL,invite_code TEXT UNIQUE NOT NULL,path_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS challenge_participants(id TEXT PRIMARY KEY,challenge_id TEXT NOT NULL REFERENCES challenges(id),user_id TEXT NOT NULL REFERENCES users(id),score INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(challenge_id,user_id));
CREATE TABLE IF NOT EXISTS marketplace_paths(id TEXT PRIMARY KEY,path_id TEXT UNIQUE NOT NULL REFERENCES learning_paths(id),creator_id TEXT REFERENCES users(id),price REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending',review_note TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,deleted_at TEXT);
CREATE TABLE IF NOT EXISTS marketplace_sales(id TEXT PRIMARY KEY,marketplace_path_id TEXT NOT NULL REFERENCES marketplace_paths(id),buyer_id TEXT NOT NULL REFERENCES users(id),order_id TEXT UNIQUE NOT NULL,amount REAL NOT NULL,commission REAL NOT NULL,creator_amount REAL NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),path_id TEXT NOT NULL REFERENCES learning_paths(id),rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),comment TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,path_id));
CREATE TABLE IF NOT EXISTS favorites(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),path_id TEXT NOT NULL REFERENCES learning_paths(id),created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,path_id));
CREATE TABLE IF NOT EXISTS daily_game_templates(id TEXT PRIMARY KEY,mode TEXT NOT NULL,version INTEGER NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS daily_games(id TEXT PRIMARY KEY,date TEXT NOT NULL,seed TEXT NOT NULL,path_id TEXT NOT NULL,game_mode TEXT NOT NULL,world_theme TEXT NOT NULL,data TEXT NOT NULL,is_active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS daily_date_idx ON daily_games(date,path_id);
CREATE TABLE IF NOT EXISTS generated_game_owners(game_id TEXT PRIMARY KEY REFERENCES daily_games(id),user_id TEXT NOT NULL REFERENCES users(id),topic TEXT NOT NULL,source TEXT NOT NULL CHECK(source IN ('ai','demo')),source_notice TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,deleted_at TEXT);
CREATE INDEX IF NOT EXISTS generated_games_user_idx ON generated_game_owners(user_id,created_at);
CREATE TABLE IF NOT EXISTS game_coach_contexts(message_id TEXT PRIMARY KEY REFERENCES ai_coach_messages(id) ON DELETE CASCADE,game_id TEXT REFERENCES daily_games(id),source TEXT NOT NULL DEFAULT 'demo' CHECK(source IN ('user','demo','ai','hint')),created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS game_coach_game_idx ON game_coach_contexts(game_id);
CREATE TABLE IF NOT EXISTS daily_game_questions(id TEXT PRIMARY KEY,daily_game_id TEXT NOT NULL REFERENCES daily_games(id),position INTEGER NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(daily_game_id,position));
CREATE TABLE IF NOT EXISTS daily_game_attempts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),daily_game_id TEXT NOT NULL REFERENCES daily_games(id),status TEXT NOT NULL DEFAULT 'playing',started_at TEXT NOT NULL,finished_at TEXT,score INTEGER NOT NULL DEFAULT 0,correct INTEGER NOT NULL DEFAULT 0,elapsed_ms INTEGER NOT NULL DEFAULT 0,event_count INTEGER NOT NULL DEFAULT 0,multiplier INTEGER NOT NULL DEFAULT 1,first_attempt INTEGER NOT NULL DEFAULT 1,suspicious INTEGER NOT NULL DEFAULT 0,xp INTEGER NOT NULL DEFAULT 0,coins INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS attempts_user_game_idx ON daily_game_attempts(user_id,daily_game_id);
CREATE TABLE IF NOT EXISTS game_events(id TEXT PRIMARY KEY,attempt_id TEXT NOT NULL REFERENCES daily_game_attempts(id),position INTEGER NOT NULL,answer INTEGER NOT NULL,correct INTEGER NOT NULL,elapsed_ms INTEGER NOT NULL,created_at TEXT NOT NULL,UNIQUE(attempt_id,position));
CREATE TABLE IF NOT EXISTS leaderboards(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),daily_game_id TEXT NOT NULL REFERENCES daily_games(id),score INTEGER NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,daily_game_id));
CREATE TABLE IF NOT EXISTS cosmetic_items(id TEXT PRIMARY KEY,title TEXT NOT NULL,price INTEGER NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS user_inventory(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),item_id TEXT NOT NULL REFERENCES cosmetic_items(id),equipped INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,item_id));
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),plan_id TEXT,marketplace_path_id TEXT,amount REAL NOT NULL,status TEXT NOT NULL DEFAULT 'awaiting_payment',proof_id TEXT,review_note TEXT,internal_note TEXT,reviewed_by TEXT REFERENCES users(id),reviewed_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS orders_user_status_idx ON orders(user_id,status);
CREATE TABLE IF NOT EXISTS payment_proofs(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),order_id TEXT REFERENCES orders(id),purpose TEXT NOT NULL,file_name TEXT NOT NULL,mime TEXT NOT NULL,bytes INTEGER NOT NULL,storage_name TEXT NOT NULL,sha256 TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,deleted_at TEXT);
CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),message TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL,updated_at TEXT);
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),path_id TEXT REFERENCES learning_paths(id),reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_actions(id TEXT PRIMARY KEY,actor_id TEXT REFERENCES users(id),action TEXT NOT NULL,target_id TEXT NOT NULL,details TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS audit_created_idx ON admin_actions(created_at);
CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS demo_mail(id TEXT PRIMARY KEY,email TEXT NOT NULL,kind TEXT NOT NULL,token TEXT NOT NULL,created_at TEXT NOT NULL);
`;
