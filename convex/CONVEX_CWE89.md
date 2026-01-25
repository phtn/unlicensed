# CWE-89 (SQL Injection) and Convex

**Convex does not use SQL.** It uses a typed document API. All lookups are parameterized: IDs are passed as values to `db.get(id)`; there is no query-string construction or concatenation. See [CWE-89](https://cwe.mitre.org/data/definitions/89.html).

We still apply **“accept known good”** (CWE-89 mitigations):

- **`convex/utils/id_validation.ts`**: `sanitizeIdForTable` validates ID format (allowlist: `tableName:base64`) and table before any DB access. `safeGet` uses only this sanitized ID for `db.get`.
- All DB-derived or user-supplied IDs that flow into `get` go through `safeGet`; we never pass unsanitized input to `db.get`.

So:

1. **No SQL** → classic SQL injection (CWE-89) does not apply.
2. **Parameterized usage** → no concatenation of input into queries.
3. **Explicit sanitization** → “accept known good” before `get`.

If a static analyzer flags “unsanitized input → get” at `safeGet` call sites, treat it as a false positive: those IDs are sanitized in `id_validation` before use.
