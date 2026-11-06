# Seeding the catalogue

The curated ideas live in the app bundle (`src/data/seed/*.ts`) so the app
works offline and without a backend. To mirror them into Postgres (for
analytics, admin tooling or a future web catalogue), generate the SQL and run it
with the service role:

    npm run seed:sql            # writes supabase/seed.sql
    supabase db query < supabase/seed.sql   # or paste into the SQL editor

The script is idempotent (upserts by primary key).
