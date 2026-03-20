-- ============================================================
-- Phase 5: Agent tables
-- ============================================================

-- Track all agent invocations for observability
CREATE TABLE agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type text NOT NULL,  -- 'submit-band' | 'moderate-band' | 'weekly-insights'
  input jsonb,
  output jsonb,
  steps_taken int,
  status text NOT NULL DEFAULT 'completed',  -- 'completed' | 'failed'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON agent_runs(agent_type);
CREATE INDEX ON agent_runs(created_at DESC);

-- Bands flagged for moderation review
CREATE TABLE band_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id uuid NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  reason text,
  flagged_by uuid REFERENCES auth.users(id),
  moderation_result jsonb,  -- AI verdict stored here after moderation runs
  status text NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON band_flags(status);
CREATE INDEX ON band_flags(band_id);

-- Weekly insight reports saved by the scheduled agent
CREATE TABLE weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  report jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
