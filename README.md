# Tars Chat - Realtime Internship Challenge

Production-style 1:1 realtime chat app using Next.js App Router, TypeScript, Convex, Clerk, Tailwind CSS, and shadcn-style UI components.

## Features

- Clerk authentication (signup, login, logout via UserButton)
- Auto-sync Clerk user profile into Convex on first sign-in
- Search users and start/open direct conversations
- Realtime private messaging with Convex subscriptions
- Sidebar with last-message preview and unread badge per conversation
- Timestamp formatting:
  - Today -> time only
  - Same year -> date + time
  - Different year -> includes year
- Presence status (online/offline)
- Typing indicator with 2-second inactivity expiry
- Smart auto-scroll + "New messages" button when user is reading older messages
- Responsive UX:
  - Desktop split view (sidebar + chat)
  - Mobile list view + full-screen chat with back navigation
- Empty states for no conversations, no messages, and no search results
- Optional feature implemented: soft delete own messages
- Optional feature implemented: emoji reactions
- Optional feature implemented: group chat creation and messaging

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Convex (DB + backend + realtime)
- Clerk (authentication)
- Tailwind CSS v4
- shadcn-style component primitives

## Project Structure

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  SyncUser.tsx
  theme-toggle.tsx
  ui/
convex/
  auth.config.ts
  schema.ts
  conversations.ts
  messages.ts
  presence.ts
  typing.ts
  users.ts
  lib/auth.ts
features/
  auth/components/AuthScreen.tsx
  chat/components/ChatShell.tsx
  chat/components/ConversationSidebar.tsx
  chat/components/ChatPanel.tsx
  users/components/UserSearchList.tsx
hooks/
  use-chat-scroll.ts
  use-mobile.ts
  use-presence.ts
lib/
  date.ts
  utils.ts
providers/
  ConvexClientProvider.tsx
  ThemeProvider.tsx
types/
  chat.ts
middleware.ts
.env.example
```

## Convex Schema (Why this design)

- `users`: app profile mirrored from Clerk for searchable names and avatars.
- `conversations`: chat room metadata + members, with `directKey` for O(1) direct-chat lookup.
- `messages`: message events with soft delete support (`deletedAt`).
- `presence`: realtime online/offline stream and last seen timestamp.
- `typingIndicators`: ephemeral typing state with `expiresAt` to auto-hide stale typing.
- `unreadCounts`: denormalized unread counters per conversation/user for fast sidebar badges.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template:

```bash
copy .env.example .env.local
```

3. Create Clerk app and fill in keys in `.env.local`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

4. Configure Convex:

```bash
npx convex dev
```

This creates/updates deployment values and generates `convex/_generated/*` typings.

5. Configure Clerk JWT template for Convex:

- In Clerk Dashboard -> JWT Templates -> create template named `convex`.
- Set `CLERK_JWT_ISSUER_DOMAIN` in `.env.local`.
- Keep `convex/auth.config.ts` provider `applicationID` as `convex`.

6. Start app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Realtime Flow

- UI uses `useQuery` to subscribe to conversations, messages, typing, presence, and unread counts.
- Mutations (`sendMessage`, `setTyping`, `markConversationRead`, `setOnlineStatus`) trigger immediate reactive updates.
- No manual polling is required.

## Interview Explanation Notes

- Business rules live in Convex functions; UI components stay focused on rendering.
- Hooks (`usePresence`, `useChatScroll`) isolate reusable client behavior.
- Unread and typing are modeled as separate tables to keep queries simple and scalable.
- Direct conversation creation uses deterministic `directKey` to avoid duplicate threads.
