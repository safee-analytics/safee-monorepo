# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Safee Analytics is a comprehensive SaaS platform designed for MENA region businesses, offering integrated modules for accounting (Hisabiq), HR & payroll (Kanz), and CRM (Nisbah) functionality with bilingual Arabic/English support. The project follows a modular monolith architecture designed to scale to microservices.

## Architecture

### System Components
- **Frontend**: React SPA (planned) - main user-facing application
- **Infrastructure**: Terraform-based IaC (`infra/`) managing Hetzner Cloud and Azure resources
- **Task Management**: Custom markdown-based task tracking system

### Technology Stack
- **Frontend**: React 18+ SPA with Vite, TypeScript, Tailwind CSS
- **Backend**: Express.js with TSOA for automatic API generation, PostgreSQL
- **Infrastructure**: Terraform with Azure-first architecture (Qatar Central for compliance)
- **State Management**: Zustand for frontend state management
- **Database**: PostgreSQL with Prisma ORM
- **API Documentation**: Auto-generated OpenAPI/Swagger via TSOA

## Common Development Commands

### Infrastructure Management (Cost-Optimized Azure)
```bash
# Development environment (Cost-optimized: ~$37/month)
cd infra/terraform/environments/dev
terraform init       # Initialize Terraform
terraform plan       # Review changes - shows cost estimates
terraform apply      # Deploy cost-optimized dev environment

# Staging environment (Production-like: ~$60/month)
cd infra/terraform/environments/staging
terraform init && terraform plan && terraform apply

# Production environment (Full compliance: ~$241/month)
cd infra/terraform/environments/prod
terraform init && terraform plan && terraform apply

# Cost monitoring
terraform output cost_estimate  # View monthly cost breakdown
az consumption budget list      # Monitor actual spending
```

### Task Management System
```bash
# Session management
./task-manager.sh start-session "Sprint Name" "Focus Area"
./task-manager.sh stop-session "Session notes"
./task-manager.sh session-status

# Task operations
./task-manager.sh add-task "Description" P0 Infrastructure
./task-manager.sh list-tasks --status TODO
./task-manager.sh complete-task 001
./task-manager.sh dashboard
```

## Project Structure & Key Files

### Documentation Architecture
- `PRD.md` - Product Requirements Document defining business requirements
- `TECHNICAL_SPEC.md` - Technical architecture and implementation details
- `IMPLEMENTATION_ROADMAP.md` - 30-month phased development plan
- `TASK_MANAGER_README.md` - Comprehensive task management documentation

### Task Management System
- `TASK_MANAGER.md` - Main task manager interface
- `TASKS.md` - Task database with sample infrastructure tasks
- `SESSIONS.md` - Development session tracking
- `DASHBOARD.md` - Real-time project analytics and progress
- `TIME_TRACKING.md` - Time logging and productivity metrics
- `task-manager.sh` - Executable CLI for task operations

### Infrastructure Components
- `infra/terraform/modules/` - Reusable Terraform modules (core, security, identity, monitoring)
- `infra/terraform/environments/` - Environment-specific configurations (dev, prod)
- `infra/docs/` - Infrastructure documentation (security, compliance, costs)

### Backend Development Commands
```bash
# Setup new backend project
npm init -y
npm install express tsoa @prisma/client prisma typescript

# Generate API routes and Swagger docs
npm run build  # Runs: tsoa spec-and-routes && tsc

# Start development server
npm run dev    # Runs: nodemon --exec tsx src/server.ts

# Database operations
npx prisma migrate dev    # Apply database migrations
npx prisma generate      # Generate Prisma client
npx prisma studio       # Open database browser

# View API documentation
# Visit: http://localhost:3000/docs (auto-generated Swagger)
```

### Frontend (React + TypeScript + Vite)
```bash
# Setup frontend project
npm create vite@latest safee-frontend -- --template react-ts
npm install zustand @tanstack/react-query tailwindcss

# Start development server
npm run dev  # Runs: vite

# Build for production
npm run build  # Runs: tsc && vite build
```

## Development Workflow

### Project Phases
1. **Phase 1 (Months 1-6)**: Foundation & Infrastructure - Core platform setup
2. **Phase 2 (Months 7-18)**: Product Suite Development - Hisabiq, Kanz, Nisbah modules  
3. **Phase 3 (Months 13-24)**: Frontend Development - Complete UI implementation
4. **Phase 4 (Months 25-30)**: Integration & Launch - Testing and production deployment

### Task Priority System
- **P0**: Critical/Blocker - immediate action required
- **P1**: High Priority - should be done this sprint
- **P2**: Medium Priority - can be done this sprint
- **P3**: Low Priority - nice to have
- **P4**: Backlog - future consideration

### Module Organization
- **Infrastructure**: Backend architecture, database, API Gateway, CI/CD
- **Hisabiq**: Accounting & Finance functionality
- **Kanz**: HR & Payroll management
- **Nisbah**: CRM features
- **Frontend**: UI/UX implementation
- **Testing**: Quality assurance and testing

## Security & Compliance Architecture

The infrastructure implements a hybrid cloud approach:
- **Hetzner Cloud**: Core application infrastructure (cost-effective)
- **Azure**: Security and compliance services (Microsoft Defender, Purview, DLP)

Key security components:
- Microsoft Defender for Cloud integration
- Azure Purview for data governance  
- Data Loss Prevention (DLP)
- Network segmentation and monitoring

## Backend Architecture (TSOA + Express)

### Simplified Structure
```
backend/
├── src/
│   ├── controllers/    # TSOA controllers (auto-generate routes)
│   │   ├── authController.ts
│   │   ├── invoiceController.ts (Hisabiq)
│   │   ├── employeeController.ts (Kanz)
│   │   └── crmController.ts (Nisbah)
│   ├── services/       # Business logic
│   ├── middleware/     # Express middleware
│   ├── models/         # TypeScript interfaces
│   ├── utils/          # Shared utilities
│   └── server.ts       # Express app setup
├── prisma/            # Database schema and migrations
└── dist/              # Compiled JavaScript (auto-generated)
```

### TSOA Controller Example
```typescript
// controllers/invoiceController.ts
@Route('api/v1/invoices')
@Tags('Invoices')
export class InvoiceController extends Controller {
  @Get('/')
  @Security('jwt')
  public async getInvoices(): Promise<Invoice[]> {
    return new InvoiceService().getAllInvoices()
  }
  
  @Post('/')
  @Security('jwt')  
  public async createInvoice(@Body() request: CreateInvoiceRequest): Promise<Invoice> {
    return new InvoiceService().createInvoice(request)
  }
}
```

### Benefits Over NestJS
- **No Dependency Injection**: Simple class instantiation
- **Auto-generated Routes**: TSOA creates Express routes from decorators
- **Auto-generated Swagger**: Documentation generated from TypeScript types
- **Lighter Weight**: Less complexity, faster startup
- **Direct Express**: Full control over middleware and configuration

## Key Technical Decisions

### Frontend
- Next.js App Router for both applications
- Tailwind CSS v4 for styling consistency
- TypeScript for type safety
- Atomic Design component methodology planned

### Infrastructure
- Multi-cloud strategy: Hetzner (cost) + Azure (security/compliance)
- Infrastructure as Code with Terraform
- Environment separation (dev/prod) with proper state management

### Development Process
- Markdown-based task management system
- Session tracking for time management and productivity
- Sprint-based development with clear milestone tracking
- Comprehensive documentation with PRD, technical specs, and roadmap

## Bilingual Support Requirements

The platform must support:
- Arabic and English languages
- RTL (Right-to-Left) layout for Arabic
- Cultural UI/UX adaptations for MENA region
- Bilingual invoice and document generation