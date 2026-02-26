CREATE TABLE "slack_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"workspace_name" text NOT NULL,
	"channel_id" text,
	"channel_name" text,
	"bot_token" text NOT NULL,
	"bot_user_id" text,
	CONSTRAINT "slack_configs_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "slack_thread_ts" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "slack_message_ts" text;--> statement-breakpoint
ALTER TABLE "slack_configs" ADD CONSTRAINT "slack_configs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;