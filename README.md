# J&G Farm Tracker

A farm operations portal for **J&G Calamansi Farm** — track harvest batches, buyer sales, field expenses, and profit & loss in one place.

**Live app:** [jgcalamansi.vercel.app](https://jgcalamansi.vercel.app)

## Features

- **Harvest batches** — Log picking in red bags (27 kg each), with optional harvester count
- **Income ledger** — Separate bag sales and kilo sales, linked to harvest batches with inventory tracking
- **Expense tracking** — Categorized costs with private receipt photo uploads
- **Dashboard** — P&L summary, cash-flow charts, inventory overview, buyer analytics, seasonal comparison, labor metrics, and low-stock alerts
- **Reports** — Filterable ledger with CSV and PDF export
- **Inventory guard** — Blocks sales that exceed remaining harvest volume
- **PWA-ready** — Installable on mobile with offline app-shell caching

## Tech stack

| Layer | Tools |
|-------|-------|
| Frontend | React 19, Vite, Tailwind CSS 4, Recharts |
| Backend | Supabase (Auth, Postgres, Storage) |
| Hosting | Vercel |
| Tests | Vitest |

## Local development

```bash
npm install
cp .env.example .env
```

Add your Supabase credentials to `.env`:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Project URL — Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key from the same page |

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm test         # Run unit tests
npm run lint     # Lint with Oxlint
npm run build    # Production build
```

## Supabase setup

### New project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the full contents of `supabase/schema.sql`.
3. Configure auth settings (see below).
4. Create your first user in **Authentication → Users**, then sign in through the app.

### Existing project (upgrade path)

Run these migrations in order if upgrading an older database:

| Order | File |
|-------|------|
| 1 | `migration_add_harvesters.sql` |
| 2 | `migration_add_red_bags.sql` |
| 3 | `migration_add_categories.sql` |
| 4 | `migration_security_hardening.sql` |
| 5 | `migration_remove_staff_users.sql` |
| 6 | `migration_drop_block_name.sql` |
| 7 | `migration_rls_owner_scoped_writes.sql` |

Skip any migration whose changes are already applied.

### Auth settings

In **Supabase → Authentication → URL Configuration**:

- **Site URL:** `https://jgcalamansi.vercel.app`
- **Redirect URLs:** `https://jgcalamansi.vercel.app/**`, `http://localhost:5173/**`

In **Providers → Email**:

- **Disable sign-ups** — the app is sign-in only; create users manually in the dashboard

### Security model

- Row Level Security (RLS) on all tables
- All authenticated users can **read** shared farm records
- Users can only **update/delete** records they created (`user_id = auth.uid()`)
- Receipt photos stored in a **private** bucket; viewed via signed URLs
- New users are created as **owner** with full app access

## Business logic

| Concept | Rule |
|---------|------|
| Red bag | 1 bag = **27 kg** |
| Bag sale | `bags × price/bag` → stored with derived kg and price/kg |
| Kilo sale | Remaining loose kg × price/kg — separate transaction |
| Gross revenue | Sum of all sale `total_amount` values (no double-counting) |
| Inventory | Per batch: harvested kg − sold kg; overselling is blocked in the form |

## Vercel deployment

1. Import the repo from [GitHub](https://github.com/klaayd39/J-G-Farm-Website).
2. Add environment variables under **Project → Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy (or redeploy after changing env vars).

Security headers are configured in `vercel.json`.

## Project structure

```
src/
  components/   UI, forms, charts, layout
  contexts/     Auth
  hooks/        Supabase queries, date range filters
  pages/        Dashboard, Harvests, Income, Expenses, Reports, Login
  utils/        farmUnits, farmAnalytics, formatters, CSV/PDF export
supabase/       Schema and SQL migrations
public/         PWA manifest and service worker
```

## Database migrations reference

| File | Purpose |
|------|---------|
| `schema.sql` | Full schema for new projects |
| `migration_add_harvesters.sql` | `num_harvesters` on harvests |
| `migration_add_red_bags.sql` | Red bag columns on income |
| `migration_add_categories.sql` | `gas` and `meal` expense categories |
| `migration_security_hardening.sql` | Shared read RLS, role lock, private receipts |
| `migration_remove_staff_users.sql` | Remove staff accounts; owner-only role |
| `migration_drop_block_name.sql` | Drop unused `block_name` column |
| `migration_rls_owner_scoped_writes.sql` | Restrict writes/deletes to record owner |
