# HomeTrack — Project Status

Household shopping list & expense tracker. Next.js 16 (App Router) + TypeScript +
Tailwind v4 + shadcn/ui (Base UI) + TanStack Query + Supabase (Postgres/Auth/RLS/
Realtime) + Recharts.

**Live:** https://hometrack-orcin.vercel.app
**Repo:** https://github.com/woratansongsomjai42-svg/Shopping-list (branch `main`)
**Supabase project:** pnrsvjzwhtwzkcnlqrad
**Deploy flow:** push to `main` → Vercel auto-deploys (GitHub integration already
connected, no manual `vercel --prod` needed)

## What's built

**Household core**
- Shopping list with realtime sync; ticking an item prompts converting it
  straight into a shared expense
- Shared expense tracker ("รายจ่ายส่วนกลาง") with manual entry and a debt
  settlement calculator (min-cash-flow simplification + mark-as-settled)
- Household reminders/calendar — month grid, add reminders, all-reminders list
  below the grid
- Onboarding: create a household or join one by invite code; settings page for
  rename/delete household and member role/removal management

**Personal (private, per-user — never shared with the household)**
- Personal income/expense ledger
- Personal asset/investment portfolio (invested vs. current value, so
  gain/loss shows on the net-worth card)

**Account**
- Auth: email/password, Google + GitHub OAuth, forgot/reset password
- Profile page: avatar upload, editable display name, email, family roster,
  invite shortcut, logout

**Home page** (`/`, replaced the old redirect-to-/shopping behavior)
- Quick-nav icon grid to the other sections
- At-a-glance stats: household spend this month, personal balance this month,
  total personal assets
- The household/personal expense charts (donut + 6-month trend) live here

**Visual design**
- Full "cute, warm" restyle: peach/coral/butter-yellow palette (WCAG AA
  contrast verified), Nunito font, rounded corners, soft shadows, hover-lift
  micro-interactions — driven by shadcn design tokens so it cascades
  everywhere from a handful of edits

## Key decisions

- **Sharing model:** shopping list, shared expenses, and reminders are
  household-scoped (RLS via `household_id` + membership check). Personal
  transactions and assets are strictly private — RLS is a flat
  `user_id = auth.uid()`, no `household_id` column at all, so no policy
  mistake can leak one member's personal data to another.
- **Household cap:** 5 households per user, enforced by a DB trigger (shared
  chokepoint for both "create" and "join by invite code").
- **Migrations are never edited after being applied to production** — each
  change is a new file (`0001` through `0006` so far in
  `supabase/migrations/`). Run new ones by hand in the Supabase SQL editor;
  there's no CI/CD wired to apply them automatically.
- **Chart colors** for real data (donut/bar charts) use a separate,
  accessibility-validated categorical palette — kept distinct from the
  decorative "cute" theme colors used on badges/buttons, since data-encoding
  colors have real contrast/colorblind-safety requirements.
- **Google Calendar sync was built, then removed** (see below) — decided the
  OAuth verification friction wasn't worth it for a small family app.

## Known limitations / deliberately out of scope

- No income tracking on the *household* side (only expenses) — would need a
  schema change if wanted.
- No price/cost field on shopping list items.
- No audit log / activity history.
- Google sign-in's OAuth consent screen is still in Google Cloud "Testing"
  status — only emails added as test users can sign in with Google. Publishing
  removes that cap but shows an "unverified app" warning screen (Calendar
  scope was removed, so this mostly only matters if scopes expand again
  later).
- "Transfer ownership" isn't a dedicated one-click action — works today via
  changing the other member's role to owner in Settings.

## Bugs found and fixed along the way

- `font-sans` was never actually wired to the loaded font, so headings
  silently fell back to a system serif — fixed when the font was swapped to
  Nunito.
- base-ui's `Select` doesn't auto-resolve labels from `SelectItem` children
  (unlike Radix) — every Select in the app needed an explicit `items` prop.
- Deleting a household was blocked by the "last owner" protection trigger,
  because deleting cascades into deleting the owner's own `household_members`
  row, which the trigger misread as "removing the last owner" instead of "the
  household is gone anyway." Fixed in migration `0006`.

## Next steps / open items

- Decide whether to publish the Google OAuth consent screen (removes the
  100-test-user cap, shows an unverified-app warning) or keep manually adding
  testers — no action needed unless Google sign-in becomes a blocker for real
  family members.
- No other open work is tracked right now — this file should be updated as a
  quick "what's the state of things" reference whenever a new feature or fix
  lands, since nothing else in the repo captures decision history like this.
