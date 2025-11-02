-- ============================================
-- Cron Jobs Migration
-- Schedules automated tasks using pg_cron
-- ============================================

-- Enable required extensions
-- Note: pg_cron is only available on Supabase projects with certain plans
-- For free tier, you may need to use alternative scheduling (Vercel Cron, etc.)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Function to safely schedule cron job
-- This removes existing job before creating new one
DO $$
DECLARE
  v_jobid INTEGER;
BEGIN
  -- Remove existing job if it exists
  SELECT jobid INTO v_jobid
  FROM cron.job
  WHERE jobname = 'check-notifications';
  
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule('check-notifications');
  END IF;
END $$;

-- Schedule notification check (runs daily at 9 AM UTC)
-- IMPORTANT: Replace placeholders before running:
-- 1. Replace YOUR_PROJECT_ID with your Supabase project ID
-- 2. Replace YOUR_SERVICE_ROLE_KEY with your service role key
SELECT cron.schedule(
  'check-notifications',                    -- Job name
  '0 9 * * *',                             -- Cron expression: Daily at 9 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/check-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id
  $$
);

-- Verify job was created
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM cron.job
  WHERE jobname = 'check-notifications';
  
  IF v_count = 0 THEN
    RAISE WARNING 'Cron job "check-notifications" was not created. Check that pg_cron extension is enabled and placeholders are replaced.';
  ELSE
    RAISE NOTICE 'Cron job "check-notifications" scheduled successfully.';
  END IF;
END $$;

