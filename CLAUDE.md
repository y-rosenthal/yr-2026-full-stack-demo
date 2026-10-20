# Working on this project with Claude Code

This repository is the "task app" for Prof. Y. Rosenthal's course on AI-assisted
development: a Next.js web app that uses Supabase (database, logins, file storage, Edge
Functions), Google sign-in, the OpenAI API, Stripe in test mode and Vercel. It is a
maintained copy of [pixegami/task-app](https://github.com/pixegami/task-app) (see
`README.md`).

The person you work with is usually a business student with no programming background.
The course notes list every setup step in order:
<https://y-rosenthal.github.io/aiasd-in-progress/f26-class10-v001.html>. Follow their
order. Where they disagree with `README.md` or the `tutorial/` folder (the original 2025
tutorial, partly out of date), follow the course notes.

## How to work with the student

- Do one step at a time. Before each command, say in a sentence or two what it does and
  why, in plain English. Explain each technical term the first time you use it.
- After each step, check that it worked before moving on. If something fails, explain the
  error in plain English and fix it together.
- Ask before anything that deletes files, changes the student's accounts or costs money.
- When a step needs a website (GitHub, Supabase, Google Cloud, OpenAI, Stripe, Vercel) or
  installing a program, stop. Say exactly what to click and what to copy, and wait until
  the student says they're done.

## Secret keys

- The student pastes keys into files and websites themselves. Never ask for a key in the
  chat, never print one, never commit one to Git, and never write one into `CLAUDE.md`
  or a notes file. Never open the student's setup worksheet
  (`taskApp-setupWorksheet-*.xlsx`): it holds their keys.
- Keys belong only in `.env.local` and `.env.test.local` (Git ignores `.env*.local`) and
  in the Edge Functions' secrets on Supabase. To check an env file, show only the
  variable names, never the values, for example `cut -d= -f1 .env.local`.
- Before every commit, run `git status` and make sure no env file or key is included.

## Supabase

- Use the student's hosted Supabase project. Don't use Docker, and don't run
  `npx supabase start`, which runs Supabase locally in Docker.
- Run the Supabase CLI as `npx supabase ...` (the project's own copy, in
  `node_modules`), not a globally installed `supabase`.
- Don't run `supabase init`: `supabase/config.toml` already exists, so it fails.

## Changing the code

- Until the app works end to end, don't change its features or rewrite its code. If the
  code itself seems wrong (not the student's setup), explain why and suggest that the
  student tell the instructor, so the fix goes into this repository for everyone.
- Don't upgrade packages or run `npm audit fix --force` unless the course notes say to:
  it can jump to new major versions that break the app.
- Don't deploy to Vercel until everything works on the student's computer and they say
  so.
- Commit and push only when the student asks. Before pushing, say what will be uploaded.

## Project map

- `app/`: the pages (Next.js App Router): home, `dashboard`, `task`, `profile`.
- `components/`, `hooks/`, `lib/`, `types/`: the React components and the code that
  talks to Supabase (`hooks/useAuth.ts`, `hooks/useTaskManager.ts`,
  `hooks/useSubscription.ts`).
- `supabase/migrations/`: the database tables, security policies, storage bucket and
  triggers, in order.
- `supabase/functions/`: the three Edge Functions. `create-task-with-ai` asks OpenAI for
  a task label; `create-stripe-session` opens Stripe Checkout or the customer portal;
  `stripe-webhook` receives Stripe's events and updates the user's plan.
- `supabase/config.toml`: settings for the Supabase CLI.
- `tests/`: Jest tests (`npm test`). The integration tests (`tests/integration/`) need
  `.env.test.local`; the unit tests (`npx jest tests/unit`) need no keys.
- `tutorial/`: the original 2025 tutorial documents.
