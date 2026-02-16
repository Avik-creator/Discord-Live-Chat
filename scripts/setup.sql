-- Better Auth tables
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);

-- Application tables
CREATE TABLE IF NOT EXISTS "projects" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "domain" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "widget_configs" (
  "id" text PRIMARY KEY,
  "project_id" text NOT NULL UNIQUE REFERENCES "projects"("id") ON DELETE CASCADE,
  "primary_color" text NOT NULL DEFAULT '#5865F2',
  "position" text NOT NULL DEFAULT 'bottom-right',
  "welcome_message" text NOT NULL DEFAULT 'Hi! How can we help?',
  "offline_message" text NOT NULL DEFAULT 'We''ll get back to you soon.'
);

CREATE TABLE IF NOT EXISTS "discord_configs" (
  "id" text PRIMARY KEY,
  "project_id" text NOT NULL UNIQUE REFERENCES "projects"("id") ON DELETE CASCADE,
  "guild_id" text NOT NULL,
  "guild_name" text NOT NULL,
  "channel_id" text,
  "channel_name" text
);

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" text PRIMARY KEY,
  "project_id" text NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "visitor_id" text NOT NULL,
  "visitor_name" text,
  "visitor_email" text,
  "discord_thread_id" text,
  "status" text NOT NULL DEFAULT 'open',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "conv_project_visitor_idx" ON "conversations"("project_id", "visitor_id");

CREATE TABLE IF NOT EXISTS "messages" (
  "id" text PRIMARY KEY,
  "conversation_id" text NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "sender" text NOT NULL,
  "content" text NOT NULL,
  "discord_message_id" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
