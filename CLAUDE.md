# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XENITH CRM + Inventory Control System with RFID integration for audiovisual equipment rental. Built with Next.js 16 (App Router), TypeScript, Prisma ORM, PostgreSQL, and NextAuth.js v5.

## Development Commands

```bash
# Development server
npm run dev

# Build & production
npm run build
npm run start

# Linting
npm run lint

# Database
docker compose up -d          # Start PostgreSQL
docker compose down           # Stop PostgreSQL
npx prisma migrate dev        # Run migrations + generate client
npx prisma studio             # Database GUI
npm run db:seed               # Seed demo data (creates superadmin: camilo.vargas@xenith.com.co / admin123)
```

## Architecture

### Route Groups (App Router)
- `app/(auth)/` - Login page
- `app/(dashboard)/` - Protected routes requiring authentication
- `app/(public)/` - Public-facing pages (contacto)
- `app/api/` - REST API endpoints

### API Pattern
All API routes follow this pattern:
1. Check session with `auth()` from `@/auth`
2. Validate input with Zod schemas from `lib/validations/`
3. Use Prisma client from `lib/db/prisma.ts`
4. Return `NextResponse.json()`

### State Management
- **Zustand stores** (`store/`): Global state for auth, clients, projects, quotations, UI
- **React Hook Form + Zod**: Form state and validation
- **NextAuth Session**: JWT-based, 8-hour expiration

### Key Directories
- `components/dashboard/` - Tables, stats cards, data display
- `components/forms/` - Reusable forms with validation
- `components/ui/` - Primitive UI components (Card, Button, etc.)
- `hooks/` - Custom hooks for data fetching (useClients, useProjects, useQuotations)
- `lib/validations/` - Zod schemas for all entities
- `lib/pdf/` - PDF generation with @react-pdf/renderer

### Database Models (Prisma)

#### CRM Models
- **User**: Roles (SUPERADMIN, ADMIN, USER), bcrypt-hashed passwords
- **Client**: Customer records
- **Project**: Status (PROSPECT, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED), Priority levels
- **Task**: Sub-tasks within projects (TODO, IN_PROGRESS, DONE)
- **Quotation**: Auto-numbered (QT-YYYY-NNNN), status (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED)
- **QuotationItem**: Line items with quantity and unit price

#### Inventory Models
- **Category**: Product categories with color/icon
- **Supplier**: Equipment suppliers with contact info
- **Product**: Product catalog with SKU, soft-delete support
- **ProductSupplier**: Many-to-many product-supplier relationship
- **InventoryItem**: Physical items with RFID, status (IN, OUT, MAINTENANCE, LOST)
- **BulkInventory**: Quantity-based inventory without RFID
- **BulkMovement**: Bulk inventory movement history
- **RfidTag**: RFID tags with EPC, status (ENROLLED, UNASSIGNED, UNKNOWN)
- **RfidDetection**: RFID read log from readers
- **InventoryMovement**: Item movement audit trail

### Security Features
- Rate limiting in `lib/security/rate-limiter.ts` (in-memory, consider Redis for production)
- Strong password validation rules in `lib/validations/auth.ts`
- Security headers configured in `next.config.ts`
- Constant-time password comparison

## Environment Setup

Copy `.env.example` to `.env`. Default values work with docker-compose PostgreSQL:
```
DATABASE_URL="postgresql://xenith:xenith123@localhost:5432/xenith_db"
AUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RFID_API_KEY="your-rfid-reader-api-key"  # For external RFID reader integration
```
