/**
 * Compare anon vs service_role visibility for demo seed data (2026-03-01).
 *
 * Use this to confirm whether "data exists but app can't see it" is due to RLS.
 *
 * Env:
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY (or SUPABASE_KEY)
 * - SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://ftvalqzaiooebkulafzg.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const CLASS_CODE = "체험용";
const EVAL_DATE = "2026-03-01";

if (!SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_ANON_KEY (or SUPABASE_KEY).");
  process.exit(2);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(2);
}

function makeClient(key) {
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false },
    db: { schema: "public" },
  });
}

async function count(client, table, filters) {
  let q = client.from(table).select("id", { head: true, count: "exact" });
  for (const [col, val] of Object.entries(filters)) q = q.eq(col, val);
  const { count, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, count: count ?? 0 };
}

const targets = [
  { table: "objectives", filters: { class_code: CLASS_CODE, eval_date: EVAL_DATE } },
  { table: "tasks", filters: { class_code: CLASS_CODE, eval_date: EVAL_DATE } },
  { table: "rating_criteria", filters: { class_code: CLASS_CODE, eval_date: EVAL_DATE } },
  { table: "reviews", filters: { class_code: CLASS_CODE, review_date: EVAL_DATE } },
];

try {
  const anon = makeClient(SUPABASE_ANON_KEY);
  const svc = makeClient(SUPABASE_SERVICE_ROLE_KEY);

  const rows = [];
  for (const t of targets) {
    const [a, s] = await Promise.all([
      count(anon, t.table, t.filters),
      count(svc, t.table, t.filters),
    ]);
    rows.push({
      table: t.table,
      anon: a,
      service_role: s,
      likely_rls: s.ok && (s.count ?? 0) > 0 && (!a.ok || (a.count ?? 0) === 0),
    });
  }

  console.log(
    JSON.stringify(
      {
        class_code: CLASS_CODE,
        date: EVAL_DATE,
        note:
          "If service_role sees rows but anon sees 0 (or errors), it's almost certainly RLS/policies.",
        results: rows,
      },
      null,
      2
    )
  );
  process.exit(0);
} catch (err) {
  console.error("compare check failed:", err?.message || err);
  process.exit(1);
}

