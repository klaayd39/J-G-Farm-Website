# J&G Farm Website

Farm operations portal for harvest tracking, sales, expenses, and P&L reporting.

## Local development

```bash
npm install
cp .env.example .env
# Add your Supabase URL and anon key to .env
npm run dev
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Project URL from Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key from the same page |

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in **SQL Editor** (fresh project), or run individual migrations in `supabase/` if upgrading an existing database.
3. **Important:** Run `supabase/migration_security_hardening.sql` on existing projects to apply shared farm data, role locking, and private receipts.
4. Promote your owner account in SQL Editor:

```sql
UPDATE profiles SET role = 'owner' WHERE email = 'your-email@farm.ph';
```

### Supabase Auth settings (Dashboard → Authentication)

- **Site URL:** `https://jgcalamansi.vercel.app` (or your production domain)
- **Redirect URLs:** add `https://jgcalamansi.vercel.app/**` and `http://localhost:5173/**`
- **Sign up:** consider disabling public registration under **Providers → Email** if only invited staff should join

### Role model

- New signups are always created as **staff**
- Only an administrator can promote users to **owner** via SQL or the Supabase Table Editor
- Staff can log harvests and expenses; owners also see income and reports

## Vercel deployment

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Add environment variables under **Project → Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Redeploy after adding variables.

Production URL: `https://jgcalamansi.vercel.app`

## Database migrations

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Full schema for new projects |
| `supabase/migration_add_harvesters.sql` | Adds `num_harvesters` to harvests |
| `supabase/migration_add_red_bags.sql` | Adds red bag columns to income |
| `supabase/migration_add_categories.sql` | Adds gas/meal expense categories |
| `supabase/migration_security_hardening.sql` | Shared data RLS, role lock, private receipts |
