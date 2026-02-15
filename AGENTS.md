## Encoding Rules (Korean Safety)
- Always keep source files (`.js`, `.html`, `.css`, `.md`, `.json`) in UTF-8.
- Do not re-encode text through CP949/ANSI/Latin-1.
- If Korean looks broken in terminal output, treat it as display issue first and verify actual file bytes before editing.
- Do not mass-replace Korean literals when mojibake is only in console rendering.
- In PowerShell writes, use explicit UTF-8 encoding (`Set-Content -Encoding utf8`).

## Supabase Quick Checks (Runbook)
- This workspace's frontend uses Supabase project URL `https://ftvalqzaiooebkulafzg.supabase.co` (see `app.js`).
- Demo seed reference: `class_code='체험용'`, date `2026-03-01`.
- The web app reads with the `anon` key; SQL Editor runs with elevated privileges. If SQL Editor shows rows but the app does not, suspect RLS first.
- Demo mode normally uses mock data. Use `app.html?demo=student&demo_live=1` (or `demo=teacher`) to read demo data from Supabase (writes are still blocked).

### 1) SQL Editor: Does Data Exist For The App Filters?
```sql
select count(*) from public.objectives where class_code='체험용' and eval_date='2026-03-01';
select count(*) from public.tasks where class_code='체험용' and eval_date='2026-03-01';
select count(*) from public.rating_criteria where class_code='체험용' and eval_date='2026-03-01';
select count(*) from public.reviews where class_code='체험용' and review_date='2026-03-01';
```

### 2) SQL Editor: Check RLS Policies
```sql
select tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname='public'
  and tablename in ('objectives','tasks','rating_criteria','reviews','daily_reflections','classes','user_profiles');
```

### 3) Local Check Script (No Writes)
- Requires env: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (see `.env.example`).
- Run: `npm run supabase:check`

### Secrets Rule
- Never store `SUPABASE_SERVICE_ROLE_KEY` in `AGENTS.md` or any committed file. Keep it only in deployment secrets / local `.env`.
