-- ============================================================
-- Add prompt_version to ai_logs for A/B tracking
-- ============================================================

alter table ai_logs add column prompt_version text;

create index on ai_logs(prompt_version);
