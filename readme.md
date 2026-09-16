<div align="center">

# AI Voice Sales Agent

**Autonomous outbound calling system · Telugu / Hindi / English · Real-time lead qualification**


![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=flat&logo=twilio&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)
![WhatsApp](https://img.shields.io/badge/WhatsApp_Cloud_API-25D366?style=flat&logo=whatsapp&logoColor=white)

[Demo Video](https://drive.google.com/file/d/1oovhq5FskFUCzhzMVAcN0cUDYuKpUcQy/view?usp=sharing) · [Live App](https://ai-voice-sales-agent-backend.vercel.app/) · [Architecture](#architecture) · [Screenshots](#screenshots)

</div>

---

The system dials a lead on its own, pitches e-commerce website development in the language the lead answers in, runs discovery, classifies them **HOT / WARM / COLD** from indirect answers, fires a **WhatsApp mid-call** on high intent, turns spoken time into a **booked callback**, and **re-dials automatically** through a cron-driven queue.

## Summary

| | |
|---|---|
| **Places the call** | Outbound dial triggered by API or dashboard, no human on the line |
| **Languages** | Telugu, Hindi, English, including code-switched sentences |
| **Sells** | E-commerce website development, conversational not scripted |
| **Discovery** | Budget, product category, catalog size, timeline, features |
| **Classification** | HOT / WARM / COLD inferred from indirect answers |
| **Mid-call action** | WhatsApp fires on intent trigger, before the call ends |
| **Scheduling** | "call me back tomorrow morning" → resolved → booked → cron re-dials |
| **Follow-up** | Composed from actual transcript lines, not a template |
| **Dashboard** | Monitors calls, leads, callbacks, WhatsApp logs, webhooks, activity |
| **Demo video** | https://drive.google.com/file/d/1oovhq5FskFUCzhzMVAcN0cUDYuKpUcQy/view?usp=sharing |
| **Live app** | https://ai-voice-sales-agent-backend.vercel.app/ |

---

## Tech Stack

<table>
<tr><th align="left" colspan="2">Frontend</th><th align="left" colspan="2">Backend</th></tr>
<tr><td>Framework</td><td>React 18 + Vite</td><td>Framework</td><td>NestJS (Node.js)</td></tr>
<tr><td>Language</td><td>TypeScript</td><td>Language</td><td>TypeScript</td></tr>
<tr><td>Styling</td><td>Tailwind CSS</td><td>Database</td><td>MongoDB + Mongoose</td></tr>
<tr><td>Data layer</td><td>TanStack Query + Axios</td><td>Queue / Jobs</td><td><code>@nestjs/schedule</code> cron + BullMQ (Redis)</td></tr>
<tr><td>Routing</td><td>React Router</td><td>Telephony</td><td>Twilio + Vapi (outbound, streaming audio)</td></tr>
<tr><td>Charts</td><td>Recharts</td><td>STT / TTS</td><td>Sarvam AI (Indian-language speech)</td></tr>
<tr><td>Auth</td><td>JWT (httpOnly cookie)</td><td>LLM</td><td>OpenAI (reasoning, classification)</td></tr>
<tr><td>Hosting</td><td>Vercel</td><td>Messaging</td><td>WhatsApp Cloud API</td></tr>
<tr><td></td><td></td><td>Calendar</td><td>Google Calendar API</td></tr>
<tr><td></td><td></td><td>Webhooks</td><td>Vapi / Twilio → signed NestJS endpoints</td></tr>
<tr><td></td><td></td><td>Hosting</td><td>Render + MongoDB Atlas</td></tr>
</table>

---

## Architecture

```mermaid
flowchart TD
    A["Admin / API<br/>starts outbound call"] --> B["NestJS<br/>creates call record, invokes Vapi"]
    B --> C["Twilio / Vapi<br/>dials customer phone"]
    C --> D["Sarvam STT/TTS<br/>Indian-language speech"]
    D --> E["OpenAI<br/>reasoning and intent"]
    E --> F["Decision Engine<br/>qualify and classify"]
    F --> G{"HOT / WARM / COLD"}

    G -->|HOT| H["WhatsApp<br/>mid-call + follow-up"]
    G -->|WARM| I["Google Calendar<br/>callback booked"]
    G -->|COLD| J["Log + brochure"]

    H --> K[("MongoDB<br/>persistent storage")]
    I --> K
    J --> K

    I --> L["Callback Queue<br/>status: PENDING"]
    L --> M["Cron Worker<br/>every 60s"]
    M -->|due time reached| B

    C -.->|failure| X["Error indicators<br/>on call / lead record"]
    D -.->|failure| X
    E -.->|failure| X
    H -.->|failure| X
    I -.->|failure| X
```

The dashboard **monitors** this flow, it does not execute it. Failures from Twilio, Vapi, Sarvam, OpenAI, WhatsApp and Calendar surface as error indicators on the call and lead records.

**Call lifecycle**

```
Dial → Speak → Discover → Understand → Classify → Act mid-call → Schedule → Follow up
```

---

## Lead Classification

| State | Signal | Action taken |
|---|---|---|
| 🔴 **HOT** | Asks price, timeline, "how soon can you start" | WhatsApp fires **before** the call ends |
| 🟡 **WARM** | Real need with a barrier: budget, timing, decision-maker | Capture the barrier, book callback, queue re-dial |
| ⚪ **COLD** | Curious, no clear need or budget | Log, send brochure, close |

---


## API Endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/auth/signin` | Admin login |
| `POST` | `/calls/start` | Trigger outbound call |
| `GET` | `/calls` | List calls |
| `GET` | `/calls/:id` | Call detail + transcript |
| `GET` | `/leads` | List leads |
| `GET` | `/leads/:id` | Lead detail + classification |
| `GET` | `/callbacks` | Queued callbacks |
| `GET` | `/callbacks/:id` | Callback detail |
| `GET` | `/whatsapp` | Message log |
| `GET` | `/whatsapp/:id` | Message detail |
| `POST` | `/webhooks/vapi` | Call events, transcript stream |
| `GET` | `/activity` | System activity feed |

---

## Setup

```bash
# backend
cd backend && npm install
cp .env.example .env
npm run start:dev

# frontend
cd frontend && npm install
npm run dev
```



## Screenshots

### Sign In
![Sign In](screenshots/signIn.png)

### Dashboard
![Dashboard](screenshots/dashboard.png)
![Dashboard analytics](screenshots/dashboard2.png)

### Start Call
![Start Call](screenshots/startCall.png)

### Calls
![Calls](screenshots/call.png)
![Call detail](screenshots/callById.png)

### Leads
![Leads](screenshots/lead.png)
![Lead detail](screenshots/leadById.png)

### Callbacks — cron queue
![Callbacks](screenshots/callback.png)
![Callback detail](screenshots/callbackById.png)

### WhatsApp
![WhatsApp](screenshots/whatsapp.png)
![WhatsApp detail](screenshots/whatsappById.png)

### Webhooks
![Webhooks](screenshots/webhook.png)

### Activity
![Activity](screenshots/activity.png)

---

<div align="center">

**Built for ElevateScale Technologies Private Limited · ElevateBox · Banjara Hills, Hyderabad**

</div>