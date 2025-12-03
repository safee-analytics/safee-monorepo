CREATE TYPE "finance"."odoo_invoice_state" AS ENUM('draft', 'posted', 'cancel');
CREATE TYPE "finance"."odoo_move_type" AS ENUM('out_invoice', 'out_refund', 'in_invoice', 'in_refund', 'entry');
CREATE TYPE "finance"."odoo_partner_type" AS ENUM('customer', 'supplier');
CREATE TYPE "finance"."odoo_payment_state" AS ENUM('not_paid', 'in_payment', 'paid', 'partial', 'reversed');
CREATE TYPE "finance"."odoo_payment_type" AS ENUM('inbound', 'outbound', 'transfer');
CREATE TYPE "identity"."email_bounce_type" AS ENUM('hard', 'soft', 'complaint', 'unsubscribe');
CREATE TABLE "finance"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_invoice_id" integer NOT NULL,
	"name" varchar(255),
	"move_type" "finance"."odoo_move_type" NOT NULL,
	"partner_id" integer,
	"partner_name" varchar(255),
	"invoice_date" date,
	"invoice_date_due" date,
	"payment_reference" varchar(255),
	"invoice_origin" varchar(255),
	"currency_id" integer,
	"currency_name" varchar(50),
	"amount_untaxed" numeric(15, 2),
	"amount_tax" numeric(15, 2),
	"amount_total" numeric(15, 2),
	"amount_residual" numeric(15, 2),
	"state" "finance"."odoo_invoice_state",
	"payment_state" "finance"."odoo_payment_state",
	"journal_id" integer,
	"journal_name" varchar(255),
	"company_id" integer,
	"narration" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "finance"."payments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_payment_id" integer NOT NULL,
	"payment_type" "finance"."odoo_payment_type" NOT NULL,
	"partner_type" "finance"."odoo_partner_type" NOT NULL,
	"partner_id" integer,
	"partner_name" varchar(255),
	"amount" numeric(15, 2) NOT NULL,
	"currency_id" integer,
	"currency_name" varchar(50),
	"payment_date" date NOT NULL,
	"ref" varchar(255),
	"journal_id" integer,
	"journal_name" varchar(255),
	"payment_method_id" integer,
	"payment_method_name" varchar(255),
	"destination_account_id" integer,
	"destination_account_name" varchar(255),
	"state" "finance"."odoo_invoice_state",
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "identity"."email_bounces" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid,
	"email" varchar(255) NOT NULL,
	"bounce_type" "identity"."email_bounce_type" NOT NULL,
	"reason" text,
	"message_id" varchar(255),
	"bounce_count" integer DEFAULT 1 NOT NULL,
	"last_bounced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "audit"."case_documents" ADD COLUMN "ocr_text" text;
ALTER TABLE "audit"."case_documents" ADD COLUMN "ocr_processed_at" timestamp with time zone;
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "finance"."payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "identity"."email_bounces" ADD CONSTRAINT "email_bounces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;