# ElevateBox — AI Voice Sales Agent Dashboard

A production-ready React + TypeScript admin dashboard for monitoring and controlling an AI outbound voice sales agent. This frontend connects to an existing NestJS backend and does **not** implement any backend functionality.

## What This Dashboard Does

ElevateBox is an AI sales automation platform that:
- Automatically calls a potential customer at **+918688664337**
- Speaks naturally in **Telugu, Hindi, or English**
- Sells e-commerce website development services
- Qualifies leads as **HOT**, **WARM**, or **COLD**
- Triggers a **WhatsApp** message mid-call when high buying intent is detected
- Understands callback requests like "call me back tomorrow morning" and schedules them via **Google Calendar**
- Sends a personalized WhatsApp follow-up after the call with conversation context, developer mobile number, resume, and architecture image

This dashboard is the **admin control and monitoring interface** for that system. It does not directly communicate with Vapi, Sarvam AI, OpenAI, WhatsApp Business API, or Google Calendar — all such operations go through the NestJS backend.

## Tech Stack

- **React 18** with **TypeScript** (strict mode)
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for routing
- **TanStack Query** for server-state management
- **Axios** for API communication
- **React Hook Form + Zod** for form validation
- **Recharts** for data visualization
- **Lucide React** for icons

## Folder Structure

```
src/
├── api/
│   ├── client.ts              # Axios instance, interceptors, token management
│   └── services/              # One service per backend resource
│       ├── authService.ts
│       ├── dashboardService.ts
│       ├── callsService.ts
│       ├── leadsService.ts
│       ├── callbacksService.ts
│       ├── whatsappService.ts
│       ├── actionEventsService.ts
│       ├── webhookEventsService.ts
│       └── systemService.ts    # Agent config, files, settings, health
├── components/
│   ├── ErrorBoundary.tsx
│   ├── ProtectedRoute.tsx
│   ├── StartCallModal.tsx      # Reusable outbound call dialog
│   ├── layout/
│   │   ├── AppLayout.tsx       # Main shell with sidebar + topbar
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   └── ui/                     # Reusable component library
│       ├── Badge.tsx
│       ├── Breadcrumbs.tsx
│       ├── CallStatusBadge.tsx
│       ├── Card.tsx            # PageHeader, ChartCard
│       ├── ChatMessage.tsx
│       ├── DataTable.tsx
│       ├── Drawer.tsx
│       ├── JsonViewer.tsx
│       ├── Modal.tsx
│       ├── Pagination.tsx
│       ├── SearchInput.tsx
│       ├── Select.tsx          # Select, FilterBar
│       ├── StatCard.tsx
│       ├── States.tsx          # Skeleton, ErrorState, EmptyState
│       ├── Tabs.tsx
│       ├── TemperatureBadge.tsx
│       └── Timeline.tsx
├── hooks/
│   └── useQueries.ts           # All TanStack Query hooks
├── lib/
│   ├── actionEvents.ts         # Action event icon/label helpers
│   └── utils.ts                # Formatting utilities
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── CallsPage.tsx
│   ├── CallDetailsPage.tsx
│   ├── LeadsPage.tsx
│   ├── LeadDetailsPage.tsx
│   ├── CallbacksPage.tsx
│   ├── WhatsAppPage.tsx
│   ├── ActionEventsPage.tsx
│   ├── WebhookEventsPage.tsx
│   ├── AgentConfigPage.tsx
│   ├── FilesPage.tsx
│   ├── SettingsPage.tsx
│   └── NotFoundPage.tsx
├── providers/
│   ├── AuthContext.tsx
│   └── ToastContext.tsx
├── types/
│   └── api.ts                  # All TypeScript interfaces
├── App.tsx                     # Router + providers
└── main.tsx                    # Entry point
```

## Routes

| Route | Page | Protected |
|-------|------|-----------|
| `/login` | Login page | No |
| `/` | Dashboard Overview | Yes |
| `/calls` | Calls list | Yes |
| `/calls/:id` | Call Details | Yes |
| `/leads` | Leads list | Yes |
| `/leads/:id` | Lead Details | Yes |
| `/callbacks` | Callbacks list | Yes |
| `/whatsapp` | WhatsApp Messages | Yes |
| `/activity` | Action Events | Yes |
| `/webhooks` | Webhook Events | Yes |
| `/agent` | Agent/Voice Configuration | Yes |
| `/files` | Files/Assets | Yes |
| `/settings` | Settings/Configuration | Yes |
| `/404` | Not Found | No |

Major pages are lazy-loaded via `React.lazy()` for code splitting.

## Authentication Flow

1. User enters email and password on the Login page
2. Frontend sends `POST /api/v1/auth/login` to the backend
3. Backend returns a JWT access token
4. Token is stored in `localStorage` and attached to all requests via an Axios interceptor (`Authorization: Bearer <token>`)
5. On any `401` response, the token is cleared and the user is redirected to `/login`
6. Protected routes check authentication state and redirect unauthenticated users

No registration is provided — the backend controls account creation.

## Environment Variables

Only frontend-safe variables are used. Copy `.env.example` to `.env`:

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

**Never** add server secrets to the frontend `.env`:
- `VAPI_API_KEY`
- `SARVAM_API_KEY`
- `OPENAI_API_KEY`
- `WHATSAPP_ACCESS_TOKEN`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`

All secrets remain in the NestJS backend.

## Development Setup

```bash
npm install
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL to your NestJS backend URL
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format source files with Prettier |
| `npm run typecheck` | TypeScript type checking without emitting |

## Connecting to the NestJS Backend

1. Ensure the NestJS backend is running and accessible
2. Set `VITE_API_BASE_URL` in `.env` to the backend's base URL including `/api/v1`
3. Ensure the backend's CORS configuration allows the frontend origin
4. Start the frontend with `npm run dev`
5. Log in with backend-provided credentials

The frontend expects these backend endpoints:
- `POST /api/v1/auth/login`
- `GET /api/v1/dashboard/overview`
- `POST /api/v1/calls/start`
- `GET /api/v1/calls`
- `GET /api/v1/calls/:id`
- `GET /api/v1/calls/:id/transcript`
- `GET /api/v1/calls/:id/lead`
- `GET /api/v1/calls/:id/actions`
- `GET /api/v1/leads`
- `GET /api/v1/leads/:id`
- `GET /api/v1/callbacks`
- `GET /api/v1/whatsapp/messages`
- `GET /health` (optional, for health indicator)

## Dashboard Functionality

### Dashboard Overview
- KPI cards: total calls, completed, failed, in-progress, HOT/WARM/COLD leads, callbacks, WhatsApp messages
- Charts: call activity over time, lead temperature distribution (pie), call success/failure (bar), WhatsApp & callback activity (area)
- Recent activity timeline with action events
- System architecture flow visualization (Admin → NestJS → Vapi → Sarvam → OpenAI → Decision → HOT/WARM/COLD → WhatsApp/Calendar/Follow-up → MongoDB)
- "Start Outbound Call" button opening a modal dialog

### Real Outbound Call Flow
1. Admin clicks "Start Outbound Call" on the dashboard or calls page
2. A modal opens with the phone number pre-filled to `+918688664337`
3. On submission, `POST /api/v1/calls/start` is called
4. The success view shows internal call ID, Vapi call ID, and status
5. A button navigates to the Call Details page

### Live Call Monitoring
- The Call Details page polls the backend every 5 seconds while a call is active
- Polling stops when the call reaches a terminal state (completed, failed)
- Active calls show a live snapshot: transcript message count, action event count, current lead temperature
- HOT detection, WhatsApp triggers, and callback requests are shown only after the backend reports them — never fabricated

### HOT / WARM / COLD Display
- Color-coded badges with icons: red flame (HOT), orange thermometer (WARM), blue snowflake (COLD)
- Used consistently across dashboard, calls table, lead details, and action events
- Classification reason/evidence shown when the backend provides it

### Mid-Call WhatsApp Display
- WhatsApp messages are categorized as mid-call HOT or post-call follow-up
- The Call Details WhatsApp tab explains the distinction
- The WhatsApp page shows full message content, status, provider ID, delivery info, and attachments

### Callback Display
- Callbacks page distinguishes the natural-language request ("call me back tomorrow morning") from the parsed scheduled time
- Shows timezone (e.g., Asia/Kolkata), confidence, Google Calendar event ID
- A detail drawer shows all callback information

### Post-Call Follow-Up Display
- Follow-up WhatsApp messages contain the actual conversation context
- The Files/Assets page shows the developer resume and architecture image used in follow-ups

### Action Event UI
- Timeline and table views of all system actions
- Each event type has a dedicated icon and color
- Detail modal shows metadata, call/lead references, and timestamps

### Webhook Monitoring UI
- Shows Vapi webhook events with processing status (processed, duplicate, failed, unknown)
- Reflects the backend's idempotent processing — duplicates are clearly marked
- Unknown event types appear as unknown/ignored
- Sanitized payload viewer (no authorization headers, API keys, or sensitive data)

## Troubleshooting

**Login fails**: Verify `VITE_API_BASE_URL` is correct and the backend is running. Check that the backend accepts CORS from the frontend origin.

**401 on every request**: The JWT token may have expired. Log out and log back in. The interceptor automatically clears expired tokens.

**Dashboard shows empty states**: This is expected when no calls have been made yet. The frontend shows empty states rather than fabricated data. Start an outbound call to populate the dashboard.

**Call Details page not updating**: The page polls every 5 seconds for active calls. If the backend is slow to update, results may take a moment to appear. Use the manual refresh button.

**Charts are empty**: Charts only render when the backend returns aggregate data. If the backend does not return chart-ready data, cards and tables are shown instead.

**Webhook events page is empty**: The backend must expose a webhook events listing endpoint. If it doesn't, the page shows an appropriate error state.
