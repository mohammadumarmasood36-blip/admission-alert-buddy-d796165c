# Migrate to Supabase Auth + Fix RLS Findings

This is a large, multi-step migration. Today every table is `USING (true)` because the app authenticates parents by admission number and staff by mobile number through edge functions that mint random UUID tokens — `auth.uid()` is always `NULL`. To fix the scanner findings safely we need real Supabase Auth sessions on every request, then strict RLS based on role.

## Phase 1 — Identity model

Create the canonical identity tables (Supabase has none of these yet):

- `app_role` enum: `manager`, `principal`, `teacher`, `cashier`, `exam_incharge`, `parent`.
- `public.profiles (user_id uuid PK → auth.users, full_name, mobile, admission_number, student_id)` — one row per `auth.users` row, auto-created by a trigger on signup.
- `public.user_roles (user_id, role)` with `has_role(uuid, app_role)` SECURITY DEFINER helper (per project guidelines, roles never live on profiles).
- `public.is_staff(uuid)` helper returning true for any non-parent role.
- Link `students.parent_user_id uuid` and `staff.user_id uuid` so RLS can scope rows.

## Phase 2 — Create Supabase Auth accounts for every existing user

A one-time edge function `bootstrap-auth-accounts` (service-role) walks:

- every `staff` row → creates an `auth.users` account with synthetic email `mobile@school.local`, copies their current `Login Password` as the initial password, fills `profiles` + `user_roles`, links `staff.user_id`.
- every `students` row → creates `auth.users` with email `admission@school.local`, current `parent_password` as the initial password, links `students.parent_user_id`, assigns `parent` role.

Both will be prompted to change password on first login.

## Phase 3 — Replace login UI

- Remove the custom `supabase.functions.invoke("login")` flow in `LoginPage`, `AuthContext`, `ChangePassword`.
- Use `supabase.auth.signInWithPassword({ email: <synthetic>, password })`, where the form still asks for "Mobile number" / "Admission number" and we translate to the synthetic email locally.
- `AuthContext` becomes a thin wrapper over `supabase.auth.onAuthStateChange` + `getSession`; role/name come from `profiles`+`user_roles`.
- Delete the `login` edge function. Rewrite `change-password` to use `supabase.auth.updateUser`.

## Phase 4 — Lock down every table with real RLS

For each table, drop the four `Allow all …` policies and replace with role-scoped ones using `has_role()` / `is_staff()` / ownership checks. Examples:

- `staff`, `salary_payments`, `app_settings`: only `manager`/`principal` can write; staff can read their own row.
- `students`: staff full access; a parent can SELECT only `WHERE parent_user_id = auth.uid()`.
- `fee_payments`, `payment_intents`: staff (cashier/manager/principal) write; parent SELECT only their child's rows.
- `attendance`, `homework`, `exam_results`, `exam_schedules`, `student_notices`: staff write; parent SELECT only rows tied to their `student_id`.
- `notices`: SELECT open to authenticated users; writes restricted to staff.
- `push_subscriptions`: owner-only (`student_id = (select student_id from profiles where user_id=auth.uid())`).
- `credential_delivery_log`: staff-only.
- Drop `anon` GRANTs everywhere and grant `SELECT/INSERT/UPDATE/DELETE` to `authenticated` instead.

Also enable RLS on `realtime.messages` (broadcast topic check via `auth.uid()`) so parents can only subscribe to their own student/class channels.

## Phase 5 — Update edge functions

- `create-payment-intent`, `verify-payment`, `send-push`, `send-sms` etc.: keep service-role for writes but require `Authorization: Bearer <session.access_token>`, validate via `supabase.auth.getClaims()`, then check `has_role` before mutating.
- Remove the `token` parameter pattern entirely — the JWT is the token.

## Phase 6 — Plaintext password cleanup

After everyone has migrated, drop `staff."Login Password"` and `students.parent_password` columns so the scanner finding about plaintext passwords goes away permanently.

## Phase 7 — Verify

- Re-run security scan; all `EXPOSED_SENSITIVE_DATA` and `MISSING_RLS_PROTECTION` findings should clear.
- Manual smoke tests: parent login, teacher login, cashier login, fee submission, attendance marking, push notifications, realtime notices.
- Update `mem://security/rls-permissive-mode` → replace with a "Supabase Auth + has_role" memory.

---

## Heads-up before I start

1. **Every existing user keeps their current password** on first login (we copy it into Supabase Auth, hashed). They'll be asked to change it. There's no other safe migration path because the current values are plaintext.
2. **Synthetic emails** (`<mobile>@school.local`, `<admission>@school.local`) are required because Supabase Auth needs an email or phone. Real emails on `students` can be swapped in later per-user.
3. **The app will be unusable for ~1 deploy window** while phases 2 and 3 ship — anyone logged in via the old token system gets signed out.
4. This will take **several iterations / messages** to land safely. I'll do it phase by phase, not in a single mega-migration, so you can test between phases.

Reply **"start phase 1"** (or tell me to adjust the plan) and I'll begin with the identity tables + bootstrap function.
