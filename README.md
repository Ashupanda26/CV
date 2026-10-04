# BlueStone Pools — Website & Contractor Dashboard (demo)

A full-stack prototype for a premium swimming pool construction company:

- **Public website**: hero, about, services, filterable project gallery, interactive 3D pool viewer, process, reviews, a validated quote form and a floating WhatsApp button.
- **Admin dashboard** at `/admin`: KPIs and charts, leads, customers (with detail pages), projects (with a progress timeline), a quote builder, maintenance tickets, feedback publishing, WhatsApp-style messages, gallery management and business settings.

It runs **without any backend** (mock data held in the browser) and switches to **Supabase** when two environment variables are set.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · Supabase · React Three Fiber · Recharts · Lucide icons

---

## 1. Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command             | What it does                      |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server              |
| `npm run build`     | Type-check and build to `dist/`   |
| `npm run preview`   | Serve the production build        |
| `npm run typecheck` | Type-check only                   |

Requires Node 20+.

## 2. Demo admin access

With no Supabase variables set, the app runs in **demo mode**:

1. Go to `/admin/login`.
2. Click **Enter demo dashboard**. You don't need a password.

A banner at the top of the dashboard shows that demo mode is on. Edits are saved in that browser's `localStorage` and nowhere else. **Reset data** (in the banner or under Settings) restores the original sample data.

Once Supabase is configured, demo mode **switches off automatically** and the login form uses real Supabase Auth. The source code holds no credentials.

## 3. Environment variables

Copy `.env.example` to `.env`:

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

| Variable                 | Required          | Notes |
| ------------------------ | ----------------- | ----- |
| `VITE_SUPABASE_URL`      | For Supabase mode | Project URL (Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | For Supabase mode | The **anon / publishable** key. It is meant to be public, and Row Level Security protects the data. |

> ⚠️ Never put the `service_role` key in a `VITE_` variable. Vite bundles every `VITE_` variable into the public JavaScript. The app does not need the service role key at all.

## 4. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**: paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. It creates the tables, relationships, indexes, Row Level Security policies, a `gallery` storage bucket, and a trigger that gives every auth user a staff profile.
3. **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up". Only people you invite should become staff.
4. **Authentication → Users → Add user**: create the contractor's login (email and password, auto-confirm).
5. Add the two variables to `.env` and restart `npm run dev`.
6. Sign in at `/admin/login`, open **Settings → Load sample data** to fill the empty project with the demo dataset (optional).

### Security model (RLS)

| Who | Can do |
| --- | ------ |
| Anonymous visitor | Insert into `leads` (the quote form), read **published** `gallery_items` and `feedback`, read `business_settings` |
| Signed-in staff (a row in `public.users`) | Full read and write on every business table, plus uploads to the `gallery` bucket |

Testimonials store their own `author_name` and `author_location`, so the public site never reads the `customers` table.

## 5. Database schema

```
auth.users ──1:1── users (staff profile, role)

customers ─┬─< leads              (customer_id nullable: set once a lead is converted)
           ├─< projects ─┬─< project_updates   (build timeline stages)
           │             ├─< quotes ──< quote_items
           │             ├─< maintenance_tickets
           │             ├─< feedback
           │             └─< messages
           ├─< quotes / maintenance_tickets / feedback / messages  (project_id optional)

gallery_items       (public gallery, published flag)
business_settings   (single row, id = 1)
```

| Table | Key columns |
| ----- | ----------- |
| `users` | id → auth.users, full_name, email, role (`admin`/`staff`) |
| `customers` | name, email, phone, address, postcode, status (`prospect`/`active`/`completed`) |
| `leads` | name, email, phone, postcode, enquiry_type, budget, message, status (`new`/`contacted`/`site_visit`/`quote_sent`/`won`/`lost`), estimated_value, source, customer_id? |
| `projects` | customer_id, name, location, pool_type, value, start_date, expected_completion, status (`planning`/`design`/`approved`/`construction`/`completed`), progress 0–100, images text[] |
| `project_updates` | project_id, stage, note, sort_order, completed, completed_at |
| `quotes` | quote_number, customer_id, project_id?, status (`draft`/`sent`/`approved`/`declined`), notes, valid_until, total |
| `quote_items` | quote_id, category, description, amount, sort_order |
| `maintenance_tickets` | ticket_number, customer_id, project_id?, issue, description, priority, status (`open`/`assigned`/`in_progress`/`resolved`/`closed`), assigned_to |
| `feedback` | customer_id, project_id?, author_name, author_location, rating 1–5, comment, published |
| `messages` | customer_id, project_id?, direction (`inbound`/`outbound`), body, status (`unread`/`read`/`replied`), channel |
| `gallery_items` | title, category, location, pool_type, description, image_url, published, sort_order |
| `business_settings` | company_name, phone, email, whatsapp_number, address, business_hours, social URLs |

The full DDL is in `supabase/schema.sql`, and the TypeScript mirror is in `src/types/index.ts`.

## 6. Connecting WhatsApp later

**What works today, without an API:**
- Every WhatsApp button uses a `wa.me` click-to-chat link built from the number under **Settings**. The public site pre-fills *"Hi, I'm interested in having a swimming pool built and would like to discuss my requirements."*
- **Send via WhatsApp** (quotes), **Send update** (projects) and **Send WhatsApp Message** (messages) open WhatsApp with a pre-written message. The contractor presses send.
- **Reply** on the Messages page logs the reply to the conversation, and is a demo action.

**To send and receive automatically** (WhatsApp Business Platform / Cloud API):
1. Create a Meta Business account and a WhatsApp Business app at developers.facebook.com, then add and verify the business phone number.
2. Create a **Supabase Edge Function** `whatsapp-send` that calls `POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages` with the access token stored as a function secret (`supabase secrets set WHATSAPP_TOKEN=...`). Never call the Graph API from the browser.
3. Create a second Edge Function `whatsapp-webhook`, register it as the webhook URL in Meta, and insert incoming messages into `messages` (`direction = 'inbound'`, `status = 'unread'`).
4. Swap the demo calls in `src/lib/whatsapp.ts` / `MessagesPage.tsx` for `supabase.functions.invoke('whatsapp-send', { body: { to, text } })`.
5. Messages sent to customers more than 24 hours after their last message must use pre-approved **message templates** (for example quote-sent or project-update templates).

Providers such as Twilio or 360dialog wrap the same API if the client prefers a managed option.

## 7. Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository. Vercel detects Vite automatically (build `npm run build`, output `dist`).
3. Under **Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Leave them out to deploy the demo-mode version.
4. Click **Deploy**.

`vercel.json` rewrites every route to `index.html`, so deep links such as `/admin/projects/…` work on refresh.

In Supabase → **Authentication → URL Configuration**, set the Site URL to the Vercel domain.

## 8. Project structure

```
src/
  App.tsx                 routes (admin pages are lazy-loaded)
  services/db.ts          data layer: Supabase OR localStorage mock, same API
  hooks/useTable.ts       load + live-refresh a table
  context/                auth, toasts, business settings
  data/mock.ts            realistic seed data (relative dates, deterministic UUIDs)
  data/images.ts          Unsplash placeholder photography
  lib/                    supabase client, WhatsApp links, constants, utils
  types/index.ts          domain types (mirror the SQL schema)
  components/
    ui/                   Button, Badge, Field, Modal, ConfirmDialog, Card, states…
    public/               website sections + layout
    admin/                dashboard layout + charts
    pool3d/PoolScene.tsx  React Three Fiber scene (lazy-loaded)
  pages/public | pages/admin
supabase/schema.sql       tables, relationships, RLS, storage bucket
```

## Notes and limitations

- Photos are Unsplash placeholders loaded from the Unsplash CDN. Replace them with the client's own project photos before going live. A branded fallback appears if an image fails to load.
- The 3D viewer (~250 KB gzipped) downloads only when its section scrolls near the viewport.
- Privacy and Terms pages contain placeholder copy that needs proper legal review.
