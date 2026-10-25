CREATE TYPE "public"."brand_status" AS ENUM('showcase', 'hold', 'reserve');--> statement-breakpoint
CREATE TYPE "public"."fit_kind" AS ENUM('free', 'classic', 'fitted', 'cropped');--> statement-breakpoint
CREATE TYPE "public"."originality_kind" AS ENUM('original', 'original_licensed', 'licensed');--> statement-breakpoint
CREATE TYPE "public"."shop_kind" AS ENUM('site', 'multibrand', 'wildberries', 'ozon', 'yandex_market', 'lamoda', 'telegram', 'vk');--> statement-breakpoint
CREATE TABLE "brand_decors" (
	"brand_id" text NOT NULL,
	"decor_id" integer NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "brand_decors_brand_id_decor_id_pk" PRIMARY KEY("brand_id","decor_id")
);
--> statement-breakpoint
CREATE TABLE "brand_fits" (
	"brand_id" text NOT NULL,
	"fit_id" integer NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "brand_fits_brand_id_fit_id_pk" PRIMARY KEY("brand_id","fit_id")
);
--> statement-breakpoint
CREATE TABLE "brand_print_techniques" (
	"brand_id" text NOT NULL,
	"print_technique_id" integer NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "brand_print_techniques_brand_id_print_technique_id_pk" PRIMARY KEY("brand_id","print_technique_id")
);
--> statement-breakpoint
CREATE TABLE "brand_shops" (
	"brand_id" text NOT NULL,
	"kind" "shop_kind" NOT NULL,
	"url" text NOT NULL,
	"name" text,
	"promo_code" text,
	"utm" boolean DEFAULT true NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "brand_shops_brand_id_kind_pk" PRIMARY KEY("brand_id","kind")
);
--> statement-breakpoint
CREATE TABLE "brand_styles" (
	"brand_id" text NOT NULL,
	"style_id" integer NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "brand_styles_brand_id_style_id_pk" PRIMARY KEY("brand_id","style_id")
);
--> statement-breakpoint
CREATE TABLE "brand_themes" (
	"brand_id" text NOT NULL,
	"theme_id" integer NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "brand_themes_brand_id_theme_id_pk" PRIMARY KEY("brand_id","theme_id")
);
--> statement-breakpoint
CREATE TABLE "brand_values" (
	"brand_id" text NOT NULL,
	"value_id" integer NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "brand_values_brand_id_value_id_pk" PRIMARY KEY("brand_id","value_id")
);
--> statement-breakpoint
CREATE TABLE "values" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"color" text,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"status" "brand_status" DEFAULT 'showcase' NOT NULL,
	"description" text,
	"story" text,
	"price_from" integer,
	"price_to" integer,
	"maker_type" text,
	"made_in" text,
	"run" text,
	"fit_text" text,
	"sizes" text,
	"neck" text,
	"fabric_gsm" smallint,
	"fabric_gsm_to" smallint,
	"fabric_composition" text,
	"cotton100" boolean,
	"originality" "originality_kind",
	"license_confirmed" boolean DEFAULT false NOT NULL,
	"license_holder" text,
	"color" text,
	"cover" text,
	"has_offline" boolean DEFAULT false NOT NULL,
	"offline_text" text,
	"sells_in_social" boolean DEFAULT false NOT NULL,
	"data_source" text,
	"checked_at" date,
	"notion_id" text,
	"content_hash" text,
	"search_vector" "tsvector",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "click_daily" (
	"brand_id" text NOT NULL,
	"shop" "shop_kind" NOT NULL,
	"day" date NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"campaign" text DEFAULT '' NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "click_daily_brand_id_shop_day_source_campaign_pk" PRIMARY KEY("brand_id","shop","day","source","campaign")
);
--> statement-breakpoint
CREATE TABLE "decors" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"color" text,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fits" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" "fit_kind",
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"file" text NOT NULL,
	"file_sha256" text NOT NULL,
	"schema_version" text,
	"added" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"unchanged" integer DEFAULT 0 NOT NULL,
	"hidden" integer DEFAULT 0 NOT NULL,
	"options" text
);
--> statement-breakpoint
CREATE TABLE "print_techniques" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"color" text,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "styles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"color" text,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"color" text,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_decors" ADD CONSTRAINT "brand_decors_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_decors" ADD CONSTRAINT "brand_decors_decor_id_decors_id_fk" FOREIGN KEY ("decor_id") REFERENCES "public"."decors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_fits" ADD CONSTRAINT "brand_fits_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_fits" ADD CONSTRAINT "brand_fits_fit_id_fits_id_fk" FOREIGN KEY ("fit_id") REFERENCES "public"."fits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_print_techniques" ADD CONSTRAINT "brand_print_techniques_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_print_techniques" ADD CONSTRAINT "brand_print_techniques_print_technique_id_print_techniques_id_fk" FOREIGN KEY ("print_technique_id") REFERENCES "public"."print_techniques"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_shops" ADD CONSTRAINT "brand_shops_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_styles" ADD CONSTRAINT "brand_styles_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_styles" ADD CONSTRAINT "brand_styles_style_id_styles_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."styles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_themes" ADD CONSTRAINT "brand_themes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_themes" ADD CONSTRAINT "brand_themes_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_values" ADD CONSTRAINT "brand_values_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_values" ADD CONSTRAINT "brand_values_value_id_values_id_fk" FOREIGN KEY ("value_id") REFERENCES "public"."values"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "click_daily" ADD CONSTRAINT "click_daily_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_decors_item_idx" ON "brand_decors" USING btree ("decor_id");--> statement-breakpoint
CREATE INDEX "brand_fits_item_idx" ON "brand_fits" USING btree ("fit_id");--> statement-breakpoint
CREATE INDEX "brand_print_techniques_item_idx" ON "brand_print_techniques" USING btree ("print_technique_id");--> statement-breakpoint
CREATE INDEX "brand_styles_item_idx" ON "brand_styles" USING btree ("style_id");--> statement-breakpoint
CREATE INDEX "brand_themes_item_idx" ON "brand_themes" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "brand_values_item_idx" ON "brand_values" USING btree ("value_id");--> statement-breakpoint
CREATE UNIQUE INDEX "values_slug_uq" ON "values" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "values_name_uq" ON "values" USING btree ("name");--> statement-breakpoint
CREATE INDEX "brands_status_idx" ON "brands" USING btree ("status");--> statement-breakpoint
CREATE INDEX "brands_search_idx" ON "brands" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "click_daily_day_idx" ON "click_daily" USING btree ("day");--> statement-breakpoint
CREATE UNIQUE INDEX "decors_slug_uq" ON "decors" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "decors_name_uq" ON "decors" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "fits_slug_uq" ON "fits" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "fits_name_uq" ON "fits" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "print_techniques_slug_uq" ON "print_techniques" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "print_techniques_name_uq" ON "print_techniques" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "styles_slug_uq" ON "styles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "styles_name_uq" ON "styles" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "themes_slug_uq" ON "themes" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "themes_name_uq" ON "themes" USING btree ("name");