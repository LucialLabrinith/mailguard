# MailGuard Forensics

AI-Powered Email Threat Detection, Geolocation & Forensic Intelligence Platform with inbox intelligence, relay tracing, and campaign correlation.

## Key Features

- **In-App Microsoft 365 & Outlook Account**: Native in-app authentication, real-time Entra ID / Microsoft Graph verification, automated mail stream ingestion, and seamless live synchronization without external popup blockers.
- **AI-Powered Threat Analysis**: Multi-layer forensic analysis powered by Google Gemini, evaluating phishing vectors, BEC (Business Email Compromise), domain spoofing, and social engineering patterns.
- **Cryptographic Authentication Verification**: Comprehensive SPF, DKIM, DMARC, and BIMI protocol validation with pass/neutral/fail breakdown and raw header telemetry.
- **Origin Geolocation & Relay Path Tracing**: Visual hop-by-hop relay tracing across SMTP headers, mapping origin IP addresses, ASN registry, and geographic trajectories.
- **Forensic Dossier & PDF Export**: Instant security dossier generation and exportable forensic reports for incident response, SOC tiering, and compliance evidence.
- **Spacious & High-Density UI Modes**: Tailored viewport densities with responsive sidebar and modal layouts designed for SOC analysts.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion, D3.js
- **Backend / Proxy**: Express, Node.js, `@google/genai`, `@azure/msal-node`, `@microsoft/microsoft-graph-client`, ImapFlow, Mailparser
- **Bundler & Dev Server**: Vite 6, tsx, esbuild

## Getting Started

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API Key for server-side threat forensics and AI draft assistance |
| `APP_URL` | Base public URL of the application (e.g. `https://your-domain.com` or Cloud Run URL) |
| `AZURE_CLIENT_ID` | (Optional) Microsoft Entra ID Application (client) ID for full Graph OAuth |
| `AZURE_CLIENT_SECRET` | (Optional) Microsoft Entra ID Client Secret |
| `AZURE_TENANT_ID` | Microsoft Entra ID Tenant ID (`common`, `organizations`, or specific Tenant ID) |

### Installation

```bash
npm install
```

### Development Mode

Start the integrated Vite + Express server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Production Build & Deployment

Build the optimized client bundle and compile the backend server:

```bash
npm run build
```

This compiles:
1. Production frontend assets into `dist/`
2. Server bundle into `dist/server.cjs`

Run the production server:

```bash
npm run start
```

### Type Checking & Linting

```bash
npm run lint
```

## Push to GitHub

To push this repository to GitHub:

```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git branch -M main
git push -u origin main
```

## License

MIT
