ALTER TABLE "public"."users" ALTER COLUMN "config" TYPE JSONB USING "config"::jsonb;
