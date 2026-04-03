# MASTER PLAN — GrowthAI Lead Generation Agency
### Delhi-Focused Digital Marketing Machine

---

## 🛠️ TOOLS WE'RE BUILDING

| # | Tool | Description | Status |
|---|------|-------------|--------|
| 1 | 🌐 **Agency Landing Page** | A stunning, conversion-optimized website to attract clients with testimonials, services, and a contact form | ✅ DONE |
| 2 | 📊 **Lead Scraper + Pipeline** | A Python script to scrape Google Maps for businesses without websites or with poor SEO + Dashboard to manage leads | ✅ DONE |
| 3 | 📋 **Free Website Audit Tool** | A tool that analyzes any website and generates an audit report you can send to prospects | 🔜 NEXT |
| 4 | 📧 **Cold Email System** | Automated email templates + tracking for outreach campaigns | ⬜ TODO |
| 5 | 📱 **Social Media Lead Tracker** | A CRM-style dashboard to track your outreach, follow-ups, and deal pipeline | ⬜ TODO |

---

## FULL PROGRESS TRACKER

| Phase | Status | Description |
|-------|--------|-------------|
| **Step 1** | ✅ DONE | Authority Website + Admin Dashboard |
| **Step 2** | ✅ DONE | Google Maps Lead Scraper + Pipeline Dashboard |
| **Step 3** | 🔜 NEXT | Free Website Audit Tool (Lead Magnet) |
| **Step 4** | ⬜ TODO | Cold Email System (Outreach Engine) |
| **Step 5** | ⬜ TODO | Social Media Lead Tracker (CRM Dashboard) |
| **Step 6** | ⬜ TODO | First Clients + Case Studies |
| **Step 7** | ⬜ TODO | Scale (Referrals + Ads + Content) |

---

## STEP 1 — Agency Landing Page ✅

**Goal:** Build a conversion-optimized landing page that screams credibility.

**What was built:**
- React + Vite SPA with dark mode, glassmorphism design
- Sections: Hero, Problem/Solution, 3-Step Process, Industry Focus, Pricing, Footer
- Floating WhatsApp CTA (→ +91 87439 33258)
- Password-protected Admin Dashboard with sidebar navigation
  - **General Info** — Edit location, email, WhatsApp
  - **Pricing Packages** — Set Starter/Growth/Pro prices
  - **Lead Pipeline** — Manage scraped leads
  - **View Site** — Quick link to live site
- Smooth scroll navigation with proper anchor links

**Tech Stack:** React, Vite, Express, Node.js  
**Access:** `http://localhost:5173/` (site) | `http://localhost:5173/admin` (dashboard)  
**Admin Password:** `growthaimaster`

---

## STEP 2 — Lead Scraper + Pipeline Dashboard ✅

**Goal:** Automate prospect discovery. Find local businesses with weak digital presence.

**What was built:**
- Python + Playwright automated browser scraper
- SQLite database with deduplication
- Extracts: Business Name, Rating, Reviews, Phone, Website, Address, Maps URL
- "Hot Lead" detection (no website OR < 15 reviews)
- Full Lead Pipeline Dashboard inside Admin with:
  - Run scrapes from UI (enter query + count → Start)
  - Filter by: Industry, Rating, Hot Leads, No Website, Low Reviews (<15)
  - Real-time results count after filtering
  - Export CSV
  - Sortable columns + pagination
  - Direct Google Maps link per lead for sales team

**Data collected so far:**
- Dentists in Delhi (10 leads)
- Coaching Institutes in Delhi (10 leads)
- Real Estate Brokers in Delhi (10 leads)
- Interior Designers in Delhi (20 leads)
- **Total: 50 leads in database**

**Tech Stack:** Python, Playwright, SQLite, pandas

---

## STEP 3 — Free Website Audit Tool 🔜

**Goal:** Build a lead magnet that provides INSTANT value and captures contact info.

### The Concept
A prospect enters their website URL + email on your landing page → The tool instantly generates a professional audit report showing everything wrong with their site → You follow up with a personalized pitch.

### What it will do:
1. **Input:** Business owner enters their website URL + name + email + phone
2. **Analysis Engine:** The tool scans their site and checks:
   - Page load speed (Google PageSpeed Insights API)
   - Mobile-friendliness score
   - SEO score (meta tags, heading structure, alt tags, sitemap)
   - SSL certificate status
   - Google Business Profile presence
   - Social media links presence
   - Overall design/UX observations
3. **Output:** Generates a clean on-screen report + downloadable PDF with:
   - Overall score (e.g., 34/100)
   - Color-coded issues (Red: Critical, Yellow: Warning, Green: Good)
   - Specific recommendations per category
   - CTA: "Want us to fix this? Book a free call."
4. **Lead Capture:** Saves their email + phone + URL to your CRM/database for follow-up
5. **Dashboard Integration:** All audit submissions show in the Admin Dashboard

### Why this works:
- **Free value upfront** builds trust instantly
- The report PROVES their site is bad — they can see the problems themselves
- You capture their contact info in exchange for the audit
- You can send this link to scraped leads: "I ran a quick audit on your site, here's what I found..."
- Conversion rate from audit → call: **15-25%** (much higher than cold outreach)

### Technical Plan:
- Python backend (FastAPI or Express route) for the analysis engine
- Google PageSpeed Insights API (free tier: 25,000 requests/day)
- Custom SEO parser (BeautifulSoup / Cheerio)
- PDF generation for downloadable report
- New landing page section with the audit form
- Results stored in SQLite for CRM tracking

---

## STEP 4 — Cold Email System 📧

**Goal:** Systematically contact scraped leads with personalized, automated email sequences.

### What it will do:
1. **Email Template Builder** — Create reusable templates with dynamic variables:
   - `{{business_name}}`, `{{owner_name}}`, `{{city}}`, `{{website_issues}}`
2. **Multi-Touch Sequences** — Automated drip campaigns:
   - Day 1: Introduction + Audit Report link
   - Day 3: Follow-up with social proof
   - Day 7: "Last chance" with case study
3. **Tracking & Analytics:**
   - Open rate tracking (pixel)
   - Click tracking on links
   - Reply detection
   - Bounce handling
4. **Integration with Lead Pipeline:**
   - Select leads from the dashboard → Assign to email sequence
   - See email status per lead (sent, opened, clicked, replied)
5. **Compliance:**
   - Unsubscribe link in every email
   - CAN-SPAM compliant footer
   - Sending limits (max 50/day to avoid spam filters)

### Message Framework:
```
Subject: Quick question about {{business_name}}'s online presence

Hi {{owner_name}},

I noticed {{business_name}} has {{specific_issue — e.g., 'no Google reviews' or 'the website loads in 8 seconds'}}.

I put together a quick free audit — {{audit_link}}.

I help businesses like yours in {{city}} get 20-50 leads/month. Would a 10-min call be useful?

Best,
GrowthAI Team
```

### Channels to support:
- **Email (primary)** — Gmail SMTP / SendGrid for reliable delivery
- **WhatsApp (secondary)** — 5-10 personalized messages/day (NOT bulk)
- **Loom Video Audits** — 3-5/week for highest-value leads

### Technical Plan:
- Nodemailer + SendGrid API for email delivery
- Email template system with Handlebars
- Tracking pixel (1x1 transparent image) for open tracking
- Dashboard UI: Compose, schedule, track campaigns
- SQLite table for email sequence state management

---

## STEP 5 — Social Media Lead Tracker (CRM) 📱

**Goal:** A CRM-style dashboard to track your entire sales pipeline from discovery to deal closed.

### What it will do:
1. **Kanban Pipeline View:**
   - Columns: New Lead → Contacted → Audit Sent → Call Scheduled → Proposal Sent → Won / Lost
   - Drag-and-drop cards between stages
2. **Lead Detail Cards:**
   - Business info (from scraper)
   - All interaction history (emails sent, calls made, notes)
   - Audit report results (from audit tool)
   - Next follow-up date + reminder
3. **Activity Timeline:**
   - Log calls, meetings, messages
   - Attach notes and files
   - Track who did what (for team collaboration)
4. **Analytics Dashboard:**
   - Conversion rate per stage
   - Average time-to-close
   - Revenue pipeline value
   - Best performing outreach channel
5. **Follow-Up Reminders:**
   - Daily digest of leads needing follow-up
   - Browser notifications for overdue leads
6. **Integration with other tools:**
   - Auto-import leads from scraper
   - Auto-update status from email tracking
   - Link to audit reports

### Technical Plan:
- React components (drag-and-drop with react-beautiful-dnd)
- SQLite tables: leads, activities, pipeline_stages, reminders
- API endpoints for CRUD operations on pipeline
- Dashboard charts (recharts or chart.js)

---

## STEP 6 — First Clients + Case Studies

**Goal:** Close 2-3 paying clients and generate real case studies.

### Pricing:

| Package | Price | What's Included |
|---------|-------|-----------------|
| **Starter** | ₹8,000/mo | Google Business Profile optimization + Basic local SEO + Monthly report |
| **Growth** | ₹15,000/mo | Website + SEO + Google Ads management + Lead tracking |
| **Pro** | ₹25,000/mo | Full funnel: Website + SEO + Google Ads + Meta Ads + Retargeting + Automation |
| **Website Only** | ₹15,000-30,000 (one-time) | Custom website with SEO foundation |

### Strategy:
- Offer first 2-3 clients **50% off for 2 months** in exchange for a real testimonial
- Document EVERYTHING: before/after screenshots, lead counts, revenue generated
- Turn real results into case studies on your website

### Your Positioning Statement:
**"I help local businesses in Delhi generate 20-50 leads/month using AI-powered Google ranking and targeted ads"**

---

## STEP 7 — Scale

**Goal:** Systems and growth beyond manual outreach.

### Actions:
- Build referral program (₹2,000 credit per referred client)
- Partner with CA firms and local business communities
- Start Meta Ads for your own agency (₹500-800/day budget)
- Create YouTube/LinkedIn content (long-term authority)
- Automate client reporting and lead tracking
- Hire a virtual assistant for outreach

---

## CRITICAL RULES

> ⚠️ **Rule 1:** Do NOT start outreach until Step 3 (Audit Tool) is done. Every piece of the funnel must be ready.

> ⚠️ **Rule 2:** Maximum 5-10 personalized WhatsApp messages per day. Bulk spam = number banned.

> ⚠️ **Rule 3:** Always lead with VALUE, not with a sales pitch. The audit report sells for you.

> ⚠️ **Rule 4:** Realistic cold outreach conversion: Cold message → Reply: 3-5% | Reply → Call: 30-40% | Call → Client: 10-20% | End-to-end: 0.5-2%. Plan accordingly.

> ⚠️ **Rule 5:** The biggest risk is analysis paralysis. This plan is complete enough to execute. Don't wait for perfection.

---

## WEEKLY ACTION RHYTHM (Once all tools are built)

| Day | Action | Time |
|-----|--------|------|
| **Monday** | Scrape 20 new leads in 2 target niches | 30 min |
| **Tuesday** | Send 10 personalized WhatsApp messages | 45 min |
| **Wednesday** | Record 3 Loom video audits for top leads | 1 hour |
| **Thursday** | Follow up on all pending conversations | 30 min |
| **Friday** | Post LinkedIn content + connect with 10 owners | 30 min |
| **Saturday** | Review pipeline metrics, plan next week | 20 min |
| **Sunday** | REST | — |

---

*Last Updated: April 3, 2026*  
*Agency: GrowthAI Engine — Delhi, India*
