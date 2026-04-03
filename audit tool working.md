How The Audit Tool Works
Here's the full flow:

Prospect enters URL + contact info on your landing page
         │
         ▼
   Frontend (AuditForm.jsx) → POST /api/audit → Backend (server.js)
         │
         ▼
   auditEngine.js runs 3 checks IN PARALLEL:
   ┌──────────────────────────────────────────┐
   │  1. fetchPage() — Downloads the HTML     │
   │     └→ analyzeSEO() — Parses with        │
   │        Cheerio (15 checks on the HTML)   │
   │                                          │
   │  2. checkSSL() — HTTPS handshake to      │
   │     check certificate validity + expiry  │
   │                                          │
   │  3. getPageSpeedScore() — Calls Google's │
   │     free PageSpeed API (no key needed)   │
   └──────────────────────────────────────────┘
         │
         ▼
   Scores are blended:
   40% on-page SEO + 25% speed + 20% Google SEO + 15% accessibility
         │
         ▼
   Result saved to audits.db (SQLite) with contact info
         │
         ▼
   Frontend shows: Score ring + Grade + PageSpeed cards +
   Color-coded issues (red/yellow/green) + CTA → WhatsApp call
Key files:

backend/auditEngine.js — The brain (fetcher + SEO parser + SSL + PageSpeed)
backend/server.js — API routes (POST /api/audit, GET /api/audits)
src/components/AuditForm.jsx — Landing page form + results display
src/pages/AuditLeads.jsx — Admin tab showing all submissions
backend/audits.db — Every audit stored with contact info for follow-up