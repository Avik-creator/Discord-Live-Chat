-- Add AI auto-reply columns to widget_configs
ALTER TABLE widget_configs
  ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE widget_configs
  ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT NOT NULL DEFAULT 'You are a friendly and helpful customer support assistant. Answer the visitor''s question concisely. If you don''t know the answer, let them know a human agent will follow up.';

ALTER TABLE widget_configs
  ADD COLUMN IF NOT EXISTS ai_model TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile';
