/**
 * Read-only verification for demo seed data (2026-03-01).
 *
 * - Uses anon key (same as app.js / seed_supabase_demo.js).
 * - Only performs SELECTs with count; it will NOT write any data.
 */
import { createClient } from "@supabase/supabase-js";

// URL is public; key should be provided via env.
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://ftvalqzaiooebkulafzg.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "";

const CLASS_CODE = "체험용";
const EVAL_DATE = "2026-03-01";

if (!SUPABASE_ANON_KEY) {
  console.error(
    "Missing SUPABASE_ANON_KEY (or SUPABASE_KEY). Set it in your environment before running."
  );
  process.exit(2);
}

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  db: { schema: "public" },
});

async function count(table, filters) {
  let q = db.from(table).select("id", { head: true, count: "exact" });
  for (const [col, val] of Object.entries(filters)) q = q.eq(col, val);

  const { count, error } = await q;
  if (error) return { table, ok: false, error: error.message };
  return { table, ok: true, count: count ?? 0 };
}

async function sampleRow(table, filters) {
  let q = db.from(table).select("*").limit(1);
  for (const [col, val] of Object.entries(filters)) q = q.eq(col, val);
  const { data, error } = await q;
  if (error) return { table, ok: false, error: error.message };
  return { table, ok: true, row: (data && data[0]) || null };
}

const targets = [
  { table: "objectives", filters: { class_code: CLASS_CODE, eval_date: EVAL_DATE } },
  { table: "tasks", filters: { class_code: CLASS_CODE, eval_date: EVAL_DATE } },
  {
    table: "rating_criteria",
    filters: { class_code: CLASS_CODE, eval_date: EVAL_DATE },
  },
  { table: "reviews", filters: { class_code: CLASS_CODE, review_date: EVAL_DATE } },
];

try {
  const results = [];
  for (const t of targets) {
    results.push(await count(t.table, t.filters));
  }

  // If counts worked, fetch one sample row from reviews to validate visibility.
  const reviewsCount = results.find((r) => r.table === "reviews");
  const sample =
    reviewsCount && reviewsCount.ok && reviewsCount.count > 0
      ? await sampleRow("reviews", { class_code: CLASS_CODE, review_date: EVAL_DATE })
      : null;

  console.log(
    JSON.stringify(
      {
        class_code: CLASS_CODE,
        date: EVAL_DATE,
        counts: results,
        sample_review: sample,
      },
      null,
      2
    )
  );
  process.exit(0);
} catch (err) {
  console.error("check failed:", err?.message || err);
  process.exit(1);
}
