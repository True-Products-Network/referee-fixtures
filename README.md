# Referee Fixture Hub

All your referee fixtures in one place. A mobile-first Progressive Web App for consolidating match appointments from multiple assigning platforms.

## Features

- **Today View**: See your next fixture with countdown to departure
- **Calendar**: Month view with fixture status indicators
- **Check Offer**: Quick conflict checking before accepting new fixtures
- **Earnings**: Track expected, paid, and unpaid fees
- **Source Connections**: Import from Assignr, ArbiterSports, EventLink, and more
- **Google Calendar Sync**: Mirror accepted fixtures to dedicated calendar

## Tech Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Mobile**: PWA with offline support
- **Database**: Complete schema with tenant isolation, audit logging, and configuration-driven rules

## Getting Started

1. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials
2. Run migrations in `supabase/migrations/` to create the schema
3. Install dependencies: `npm install`
4. Run dev server: `npm run dev`

## Project Structure

```
src/
  app/              # Next.js app router pages
  components/ui/    # shadcn/ui components
  lib/supabase/     # Supabase clients and types
  types/            # TypeScript type definitions

supabase/migrations/  # Database schema and seed data
```

## Database Architecture

The schema supports:
- Multi-tenant design with Row Level Security
- Database-driven configuration (no hardcoded business rules)
- Comprehensive fixture records with source tracking
- Travel estimates and conflict checking
- Financial tracking with payment status
- Audit logging for all changes

## Status

Phase 1 Foundation complete. Working on:
- Phase 2: Google Calendar OAuth and sync
- Phase 3: iCalendar feed adapters
- Phase 4: Travel calculations and earnings

Built for Nigel Lear.
