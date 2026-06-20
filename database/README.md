# Database Schema & Setup Guide

This folder contains database setup files and migrations for the FlowMap application. FlowMap uses **Supabase** (PostgreSQL) for user authentication and document persistence.

---

## 🗄️ Database Tables Schema

The application database uses the following tables:

1. **`profiles`**:
   - `id` (`uuid`, references `auth.users`, primary key) — Profile identifier mapping.
   - `email` (`text`) — User email address.
   - `created_at` / `updated_at` (`timestamp with time zone`).
   - *Automated Trigger*: Signs up users and automatically creates public profile links.

2. **`folders`**:
   - `id` (`uuid`, primary key) — Unique folder identifier.
   - `user_id` (`uuid`, references `auth.users`) — Owner of the folder.
   - `name` (`text`) — Folder label (e.g. "DSA Prep").
   - `created_at` (`timestamp with time zone`) — Generation timestamp.

3. **`roadmaps`**:
   - `id` (`uuid`, primary key) — Unique roadmap identifier.
   - `user_id` (`uuid`, references `auth.users`) — Owner of the roadmap.
   - `folder_id` (`uuid`, references `folders`, nullable, sets `null` on delete) — Parent folder.
   - `name` (`text`) — Roadmap name (e.g. "Next.js Study Path").
   - `state` (`jsonb`) — Full canvas state matching the `RoadmapState` JSON structure (nodes, layout coordinates, completion progress, stats).
   - `created_at` / `updated_at` (`timestamp with time zone`).

4. **`journal_entries`**:
   - `id` (`uuid`, primary key) — Unique entry identifier.
   - `user_id` (`uuid`, references `auth.users`) — Entry author.
   - `date` (`date`) — Journal entry date (e.g. "2026-06-20").
   - `content` (`text`) — Day reflection note text.
   - `mood` (`text`) — Mood state ('great', 'good', 'okay', 'tough').
   - `linked_node_ids` (`jsonb`) — List of linked nodes on the canvas.
   - `created_at` / `updated_at` (`timestamp with time zone`).

5. **`pomodoro_sessions`**:
   - `id` (`text`, primary key) — Session token.
   - `user_id` (`uuid`, references `auth.users`) — Owner.
   - `mode` (`text`) — Focus mode ('focus', 'shortBreak', 'longBreak').
   - `completed_at` (`timestamp with time zone`) — Completion timestamp.
   - `linked_node_id` (`text`, nullable) — Connected canvas node ID.
   - `duration_seconds` (`integer`) — Focus cycle length.

---

## 🚀 Setup Instructions

1. **Create a Supabase Project**: Go to [supabase.com](https://supabase.com) and spin up a new project database.
2. **Apply Migrations**:
   - Navigate to the **SQL Editor** in the Supabase Dashboard.
   - Open [database/migrations/20260620_init_schema.sql](file:///c:/Users/ajink/Desktop/flowmap/database/migrations/20260620_init_schema.sql).
   - Copy the SQL statements and execute them. This script is fully idempotent (safely handles duplicate execution using `drop policy if exists` and `drop trigger if exists` checks).
   - Note: Supabase may still show a generic warning for DDL/schema changes, but this migration is schema-only and does not delete user data.
3. **Environment Setup**:
   - Copy your Project URL and Anon API key from the **Settings > API** panel in Supabase.
   - Paste them in your `.env.local` file inside the `frontend/` directory:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```
