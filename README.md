# Waba Guru Hosted Onboarding Gateway (`wg-gateway`)

Ultra-lightweight, dedicated multi-tenant hosted onboarding gateway for WhatsApp Embedded Signup.

## Features
- **Zero Database Overhead:** 100% stateless frontend gateway. Zero PostgreSQL/Prisma dependencies.
- **Single Popup Experience:** In-place redirect directly inside the popup window (`window.location.href`). No secondary child popups!
- **Auto-Discovery:** Automatically extracts `waba_id`, `phone_number_id`, and tokens on the backend.
- **Auto-Close & PostMessage:** Posts `WA_ONBOARDING_SUCCESS` message to the opener window and self-closes.

## Getting Started

### 1. Environment Variables
Create `.env.local`:
```bash
WG_MESSAGING_URL=http://localhost:20080
WG_API_KEY=local_development_key
PORT=3000
```

### 2. Run Locally or on Server
```bash
npm install
npm run build
npm start
```

### 3. Partner Usage
Partners link or popup directly to:
```text
https://<gateway-domain>/onboard?workspace_id=<workspace>&return_url=<partner_callback>
```
