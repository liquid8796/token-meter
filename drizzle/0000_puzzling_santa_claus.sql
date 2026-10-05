CREATE TABLE "model_pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"currency" text NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"source_url" text NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"slug" text NOT NULL,
	"api_model_id" text NOT NULL,
	"name" text NOT NULL,
	"family" text,
	"description" text NOT NULL,
	"context_window_tokens" numeric(30, 0),
	"max_output_tokens" numeric(30, 0),
	"modalities" jsonb NOT NULL,
	"status" text NOT NULL,
	"released_at" date
);
--> statement-breakpoint
CREATE TABLE "pricing_bands" (
	"id" text PRIMARY KEY NOT NULL,
	"pricing_id" text NOT NULL,
	"unit_tokens" numeric(30, 0) NOT NULL,
	"min_input_tokens_per_request" numeric(30, 0) NOT NULL,
	"max_input_tokens_per_request" numeric(30, 0),
	"input_per_unit" numeric(30, 12),
	"output_per_unit" numeric(30, 12),
	"cached_input_per_unit" numeric(30, 12),
	"cache_write_per_unit" numeric(30, 12),
	"batch_input_per_unit" numeric(30, 12),
	"batch_output_per_unit" numeric(30, 12)
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"website_url" text NOT NULL,
	"pricing_url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_pricing" ADD CONSTRAINT "model_pricing_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_bands" ADD CONSTRAINT "pricing_bands_pricing_id_model_pricing_id_fk" FOREIGN KEY ("pricing_id") REFERENCES "public"."model_pricing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "model_pricing_model_effective_idx" ON "model_pricing" USING btree ("model_id","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "model_pricing_one_open_ended_per_currency" ON "model_pricing" USING btree ("model_id","currency") WHERE "model_pricing"."effective_to" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "models_slug_unique" ON "models" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "models_provider_api_model_unique" ON "models" USING btree ("provider_id","api_model_id");--> statement-breakpoint
CREATE INDEX "models_provider_idx" ON "models" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "models_status_idx" ON "models" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pricing_bands_pricing_idx" ON "pricing_bands" USING btree ("pricing_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pricing_bands_floor_unique" ON "pricing_bands" USING btree ("pricing_id","min_input_tokens_per_request");--> statement-breakpoint
CREATE UNIQUE INDEX "providers_slug_unique" ON "providers" USING btree ("slug");