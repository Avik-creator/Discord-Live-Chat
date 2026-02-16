# Bridgecord

**Live chat that lives in Discord.** A lightweight, embeddable chat widget that connects your website visitors directly to your Discord server. Your team replies from Discord -- visitors get real-time responses on your site.

> [https://bridgecord.avikmukherjee.me](https://bridgecord.avikmukherjee.me)

---

## How It Works

1. **Create a project** in the Bridgecord dashboard.
2. **Connect your Discord server** and pick a channel for incoming chats.
3. **Embed the widget** on your site with a single `<script>` tag.
4. When a visitor starts a chat, Bridgecord creates a **Discord thread** in your chosen channel.
5. Your team replies in the thread -- the visitor sees it instantly on the website.

---

## Features

- **Discord-native support** -- reply to customers without leaving Discord.
- **Thread-per-conversation** -- each visitor chat maps to a Discord thread so nothing gets lost.
- **Customisable widget** -- change brand colour, position, welcome message, and more from the dashboard. Includes a live preview.
- **Embeddable** -- single `<iframe>` or `<script>` snippet; works on any website.
- **Conversation inbox** -- view and manage all visitor conversations in the dashboard.
- **Discord OAuth login** -- sign in with your Discord account.
- **Webhook relay** -- Discord bot pushes agent replies back to the widget in real time.

---

## Tech Stack

| Layer | Technology |
| -------------- | ------------------------------------------ |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless driver) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Auth | [Better Auth](https://www.better-auth.com) (Discord OAuth) |
| Discord API | REST v10 (bot invite, threads, messages) |
| Deployment | [Vercel](https://vercel.com) |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm
- A PostgreSQL database (Neon recommended)
- A Discord application with a bot user

### 1. Clone the repository

```bash
git clone https://github.com/Avik-creator/Discord-Live-Chat.git
cd Discord-Live-Chat
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@host/dbname

# Better Auth
BETTER_AUTH_SECRET=your-random-secret
BETTER_AUTH_URL=http://localhost:3000

# Discord OAuth (discord.com/developers/applications)
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Discord Bot
DISCORD_BOT_TOKEN=your-discord-bot-token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set up the database

```bash
pnpm drizzle-kit push
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Discord Bot Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.
2. Under **Bot**, click "Add Bot" and copy the bot token.
3. Under **OAuth2**, add `http://localhost:3000/api/auth/callback/discord` as a redirect URI (and your production URL).
4. Enable the following bot permissions:
   - View Channels
   - Send Messages
   - Embed Links
   - Read Message History
   - Create Public Threads
   - Send Messages in Threads
   - Manage Threads
5. Under **Privileged Gateway Intents**, enable **Message Content Intent** if you want the bot to relay message content.

---

## Project Structure

```
app/
  api/
    auth/             # Better Auth catch-all route
    discord/webhook/  # Receives replies from Discord bot
    projects/         # CRUD for projects and their sub-resources
    widget/           # Public widget config & messaging endpoints
  dashboard/          # Authenticated dashboard pages
  login/              # Discord OAuth login page
  widget/             # Embeddable chat widget (iframe target)
components/
  dashboard/          # Dashboard shell and navigation
  ui/                 # shadcn/ui primitives
  *.tsx               # Landing page sections (hero, features, etc.)
lib/
  auth.ts             # Better Auth instance
  auth-client.ts      # Client-side auth helpers
  db/                 # Drizzle client + schema
  discord.ts          # Discord REST API helpers
```

---

## Deployment

The project is designed to deploy on Vercel with zero configuration:

1. Push to GitHub.
2. Import the repository on [vercel.com/new](https://vercel.com/new).
3. Add all environment variables from `.env.local` to your Vercel project settings.
4. Deploy.

Make sure to update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production URL.

---

## Embedding the Widget

After creating a project and connecting Discord, go to the **Install** tab in your project dashboard. Copy the snippet and paste it into your website:

```html
<iframe
  src="https://bridgecord.avikmukherjee.me/widget/YOUR_PROJECT_ID"
  style="position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;z-index:9999;"
></iframe>
```

---

## License

MIT

---

Built by [Avik Mukherjee](https://github.com/Avik-creator).
