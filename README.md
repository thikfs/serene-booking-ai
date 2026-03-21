# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Deployment checklist (Netlify)

1. Link this GitHub repo in Netlify.
2. Set build command to `npm run build`.
3. Set publish directory to `dist`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars in Netlify.

## Local environment variables

Create a `.env` file based on `.env.example`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These power the public services list, admin dashboard, and login flow.

## Project checklist

- Landing page with hero, dynamic services grid, and floating chat widget
- Protected `/dashboard` route with login
- Supabase tables: `services`, `bookings`, `agent_settings`
- Supabase Auth enabled (Email/Password) and RLS for admin-only access
- Supabase Edge Function `chat-handler` with `check_availability` and `create_booking`
- Admin CMS: services CRUD, upcoming booking view, live prompt editor

## Phase 3: AI Bot (Supabase Edge Function)

This repo now includes a Supabase Edge Function at `supabase/functions/chat-handler/index.ts`.

### Frontend env var

- `VITE_SUPABASE_URL` — Your Supabase project URL (used by `ChatWidget` to call `${VITE_SUPABASE_URL}/functions/v1/chat-handler`).
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key used by the admin dashboard/login.

### Edge Function env vars

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`)
- Optional:
  - `LLM_PROVIDER` (`openai` or `anthropic`)
  - `OPENAI_MODEL` (default: `gpt-4o-mini`)
  - `ANTHROPIC_MODEL` (default: `claude-3-5-sonnet-20241022`)
  - `BUSINESS_HOURS_START` (default: `09:00`)
  - `BUSINESS_HOURS_END` (default: `17:00`)
  - `SLOT_INTERVAL_MINUTES` (default: `30`)

### Expected DB columns

The function assumes:

- `services`: `id`, `name`, `price`, `duration` (duration is in minutes)
- `bookings`: `service_id`, `appointment_time` (timestamptz), and optional `customer_name`, `customer_email`, `customer_phone`, `notes`
- `agent_settings`: `system_prompt`, `full_booking` (boolean)
