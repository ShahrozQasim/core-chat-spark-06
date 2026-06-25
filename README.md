# CoreChat AI

A premium, minimalist AI chat application — pure black & white, Inter typography,
smooth Framer Motion animations, ChatGPT-inspired layout with original design.

## Stack

- **TanStack Start** (React 19, file-based routing, SSR-ready)
- **TypeScript** (strict)
- **Tailwind CSS v4** with semantic design tokens
- **Framer Motion** for animations
- **Lucide React** icons
- **Recharts** for analytics
- **Inter** font via `@fontsource/inter`

## Run locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Pages

| Route                  | Description                              |
| ---------------------- | ---------------------------------------- |
| `/`                    | Animated splash → auto-redirect to login |
| `/login`               | Email / password / Google sign-in        |
| `/signup`              | Create account                           |
| `/chat`                | Sidebar + chat area, history, search     |
| `/personalities`       | Browse AI personalities                  |
| `/personalities/new`   | Create a personality                     |
| `/personalities/$id`   | Personality detail page                  |
| `/reports`             | Usage analytics, charts, achievements    |
| `/settings`            | Theme, language, notifications, account  |

## Backend integration

The app ships with a local mock layer so it runs end-to-end out of the box.
Swap in real services by setting environment variables and editing
`src/services/api.ts`.

Copy `.env.example` to `.env.local`:

```
VITE_N8N_WEBHOOK_URL=https://your-n8n.example.com/webhook/corechat
VITE_API_BASE_URL=https://api.your-domain.com
```

Your n8n workflow receives:

```json
{
  "chatId": "c_...",
  "message": "user text",
  "personalityId": "p_atlas",
  "history": [{ "role": "user", "content": "..." }]
}
```

and must respond with:

```json
{ "reply": "assistant text" }
```

## Architecture

```
src/
  routes/                # File-based pages
  components/            # UI + AppShell + Sidebar
  components/ui/         # shadcn primitives
  hooks/useChat.ts       # Chat state hook
  services/api.ts        # Auth, Chat, Personality, AI provider, Reports
  lib/api.ts             # fetch wrapper, env config
  lib/types.ts           # User / Chat / Message / Personality / Report
  lib/storage.ts         # SSR-safe localStorage wrapper
  lib/seed.ts            # Demo personalities + analytics
  styles.css             # Tailwind v4 + design tokens
```

Data models (`Users`, `Chats`, `Messages`, `Personalities`, `Reports`) mirror a
relational schema so connecting Postgres/Supabase later is straightforward.

## Deploy

The project is deployable to Vercel, Cloudflare, or any host that supports
TanStack Start. No platform-specific config is required.
