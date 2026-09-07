CREATE TABLE "active_sessions" (
	"user_id" text PRIMARY KEY NOT NULL,
	"data" jsonb,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_abuse_blocks" (
	"subject" text PRIMARY KEY NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"until" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"response" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_conversation_summaries" (
	"user_id" text PRIMARY KEY NOT NULL,
	"data" jsonb,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ai_generated_workouts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request_hash" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_request_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"action" text NOT NULL,
	"user_id" text,
	"guest_hash" text,
	"ip_hash" text,
	"status" text NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"model" text,
	"error_code" text,
	"json_valid" boolean,
	"cache_hit" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings_user" (
	"user_id" text PRIMARY KEY NOT NULL,
	"data" jsonb,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	CONSTRAINT "auth_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "baseline_tests" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "baseline_tests_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "completed_sessions" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"minutes" integer,
	"role" text,
	CONSTRAINT "completed_sessions_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"item" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"source" text DEFAULT 'admin' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_results" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	"session_id" text,
	"metric_key" text,
	"recorded_at" timestamp with time zone,
	CONSTRAINT "exercise_results_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "favorite_exercises" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "favorite_exercises_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"goal" text NOT NULL,
	"priority" integer NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "notifications_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "personal_bests" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "personal_bests_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "planned_sessions" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "planned_sessions_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"data" jsonb,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "progress_metrics" (
	"user_id" text PRIMARY KEY NOT NULL,
	"sessions" integer DEFAULT 0 NOT NULL,
	"minutes" integer DEFAULT 0 NOT NULL,
	"throws" integer DEFAULT 0 NOT NULL,
	"catches" integer DEFAULT 0 NOT NULL,
	"last_session_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"primary_role" text NOT NULL,
	"secondary_role" text,
	"intent" text,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_workouts" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "saved_workouts_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "training_plans" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "training_plans_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "training_weeks" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "training_weeks_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "user_achievements_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "user_challenges" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "user_challenges_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workout_exercises" (
	"id" text NOT NULL,
	"workout_id" text NOT NULL,
	"phase_id" text NOT NULL,
	"user_id" text NOT NULL,
	"exercise_id" text,
	"duration_minutes" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "workout_exercises_user_id_workout_id_id_pk" PRIMARY KEY("user_id","workout_id","id")
);
--> statement-breakpoint
CREATE TABLE "workout_phases" (
	"id" text NOT NULL,
	"workout_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "workout_phases_user_id_workout_id_id_pk" PRIMARY KEY("user_id","workout_id","id")
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "workouts_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" text NOT NULL,
	"user_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"data" jsonb NOT NULL,
	CONSTRAINT "xp_events_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE INDEX "ai_cache_expires_idx" ON "ai_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "ai_generated_workouts_user_idx" ON "ai_generated_workouts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_request_logs_at_idx" ON "ai_request_logs" USING btree ("at");--> statement-breakpoint
CREATE INDEX "ai_request_logs_action_idx" ON "ai_request_logs" USING btree ("action","at");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "baseline_tests_user_updated_idx" ON "baseline_tests" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "completed_sessions_user_updated_idx" ON "completed_sessions" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "completed_sessions_user_completed_idx" ON "completed_sessions" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "equipment_user_idx" ON "equipment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exercise_results_user_updated_idx" ON "exercise_results" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "exercise_results_user_session_idx" ON "exercise_results" USING btree ("user_id","session_id");--> statement-breakpoint
CREATE INDEX "favorite_exercises_user_updated_idx" ON "favorite_exercises" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_updated_idx" ON "notifications" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "personal_bests_user_updated_idx" ON "personal_bests" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "planned_sessions_user_updated_idx" ON "planned_sessions" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "saved_workouts_user_updated_idx" ON "saved_workouts" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "training_plans_user_updated_idx" ON "training_plans" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "training_weeks_user_updated_idx" ON "training_weeks" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "user_achievements_user_updated_idx" ON "user_achievements" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "user_challenges_user_updated_idx" ON "user_challenges" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "workout_exercises_workout_idx" ON "workout_exercises" USING btree ("user_id","workout_id");--> statement-breakpoint
CREATE INDEX "workout_phases_workout_idx" ON "workout_phases" USING btree ("user_id","workout_id");--> statement-breakpoint
CREATE INDEX "workouts_user_updated_idx" ON "workouts" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "xp_events_user_updated_idx" ON "xp_events" USING btree ("user_id","updated_at");