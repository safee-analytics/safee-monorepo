CREATE TYPE "system"."document_type" AS ENUM('invoice', 'bill', 'quote', 'purchase_order', 'delivery_note', 'receipt', 'credit_note', 'debit_note', 'payslip', 'contract', 'payment_receipt', 'refund');
CREATE TABLE "document_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"document_type" "system"."document_type" NOT NULL,
	"template_id" text NOT NULL,
	"template_name" text NOT NULL,
	"template_description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"customizations" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_templates_organization_id_document_type_is_active_unique" UNIQUE("organization_id","document_type","is_active")
);

ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;