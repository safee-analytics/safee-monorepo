-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."ContactType" AS ENUM ('LEAD', 'PROSPECT', 'CUSTOMER', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "public"."DealStage" AS ENUM ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "public"."EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."InvoiceType" AS ENUM ('SALES', 'PURCHASE');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."finance.accounts" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AccountType" NOT NULL,
    "parentId" UUID,
    "organizationId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance.accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system.audit_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "organizationId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" UUID,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system.audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales.contacts" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "type" "public"."ContactType" NOT NULL DEFAULT 'LEAD',
    "source" TEXT,
    "notes" TEXT,
    "organizationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales.contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales.deals" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "value" DECIMAL(10,2),
    "stage" "public"."DealStage" NOT NULL DEFAULT 'LEAD',
    "probability" INTEGER,
    "expectedCloseDate" TIMESTAMP(3),
    "contactId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales.deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hr.employees" (
    "id" UUID NOT NULL,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "salary" DECIMAL(10,2),
    "status" "public"."EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "organizationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr.employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance.invoice_items" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "productId" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "finance.invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finance.invoices" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "type" "public"."InvoiceType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "customerId" UUID,
    "supplierId" UUID,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "organizationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance.invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identity.organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity.organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hr.payroll_records" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "payPeriod" TEXT NOT NULL,
    "baseSalary" DECIMAL(10,2) NOT NULL,
    "overtime" DECIMAL(10,2),
    "bonuses" DECIMAL(10,2),
    "deductions" DECIMAL(10,2),
    "netPay" DECIMAL(10,2) NOT NULL,
    "payDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr.payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identity.permissions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity.permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identity.role_permissions" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity.role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identity.roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT,
    "organizationId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity.roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identity.user_roles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" UUID,

    CONSTRAINT "identity.user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identity.user_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity.user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identity.users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" UUID NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity.users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance.accounts_code_organizationId_key" ON "public"."finance.accounts"("code", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "hr.employees_employeeId_organizationId_key" ON "public"."hr.employees"("employeeId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "finance.invoices_number_organizationId_key" ON "public"."finance.invoices"("number", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "identity.organizations_subdomain_key" ON "public"."identity.organizations"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "identity.permissions_code_key" ON "public"."identity.permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "identity.permissions_resource_action_module_key" ON "public"."identity.permissions"("resource", "action", "module");

-- CreateIndex
CREATE UNIQUE INDEX "identity.role_permissions_roleId_permissionId_key" ON "public"."identity.role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "identity.roles_code_organizationId_key" ON "public"."identity.roles"("code", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "identity.user_roles_userId_roleId_key" ON "public"."identity.user_roles"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "identity.user_sessions_token_key" ON "public"."identity.user_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "identity.users_email_key" ON "public"."identity.users"("email");

-- AddForeignKey
ALTER TABLE "public"."finance.accounts" ADD CONSTRAINT "finance.accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."finance.accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."system.audit_logs" ADD CONSTRAINT "system.audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."identity.users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."system.audit_logs" ADD CONSTRAINT "system.audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."identity.organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales.deals" ADD CONSTRAINT "sales.deals_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."sales.contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finance.invoice_items" ADD CONSTRAINT "finance.invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."finance.invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hr.payroll_records" ADD CONSTRAINT "hr.payroll_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."hr.employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identity.role_permissions" ADD CONSTRAINT "identity.role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."identity.roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identity.role_permissions" ADD CONSTRAINT "identity.role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."identity.permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identity.roles" ADD CONSTRAINT "identity.roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."identity.organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identity.user_roles" ADD CONSTRAINT "identity.user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."identity.users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identity.user_roles" ADD CONSTRAINT "identity.user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."identity.roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identity.user_roles" ADD CONSTRAINT "identity.user_roles_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "public"."identity.users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identity.user_sessions" ADD CONSTRAINT "identity.user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."identity.users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identity.users" ADD CONSTRAINT "identity.users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."identity.organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
