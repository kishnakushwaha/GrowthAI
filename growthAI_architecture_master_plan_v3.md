# GrowthAI: Complete V3 Architecture & Implementation Plan

*Final synthesized plan. Integrates Claude audit + GPT rounds 1 & 2. Conflicts resolved. No redundancy.*

> **What changed from V2 → V3:**
> Four genuine additions from GPT incorporated: (1) Google Ads signal detection, (2) PageSpeed Insights API for real speed scores, (3) numeric SEO score replacing vague signal display, (4) Competitor Benchmark Engine — the strongest new idea. Contacts table and sequence engine tables also fully fleshed out (V2 referenced them without schema). GPT suggestions overruled: LinkedIn scraping (breaks free-tier rule), Redis queue (overkill), 7-day timeline (unrealistic).

---

## ✅ EXECUTED (Phases 1–4)

### Phase 1: Async Queue + Database Scaffolding ✅
- Replaced sync Node→Python spawn with `scrape_jobs` table polling (5s interval)
- Cloud Run no longer times out on large scrapes
- `website_enrichment` table created for deep scraper output

### Phase 2: Numeric Scoring + Deep Scraper ✅
- `is_hot_lead` boolean replaced with `lead_score` 0–100 (higher = weaker digital presence = hotter lead)
- `deep_scraper.py` visits actual business websites via Playwright-stealth
- Detects: emails, CMS stack, FB pixel, GA tag, H1, meta description
- Gemini 1.5 Flash generates AI icebreaker per lead (free tier, 1,500 req/day)

### Phase 3: Chrome Extension Automation Agent ✅
- Manifest V3 extension polls `/api/extension/pending-tasks` on localhost
- `content.js` on `web.whatsapp.com` uses MutationObserver for reply detection
- DOM selector: `document.querySelector('[aria-label*="unread message"]')`
- Fires `POST /api/extension/log-reply` → halts outbound sequence on reply

### Phase 4: Full-Funnel Dashboard Upgrades ✅
- `GET /api/leads` now joins `website_enrichment` data
- Lead Score rendered as gradient badge in `Leads.jsx`
- Extracted email surfaces in Contact column
- Async scrape completion triggers React Toast + data refetch

---

## 🚀 PROPOSED NEXT STEPS

---

### Phase 5: Dead Lead Filter + SEO Signals Tab
*Cleanup + first website intelligence view. Must be completed before Phase 6.*

#### 5.1 — Dead Lead Filter at Scrape Time (`scraper/main.py`)

Inject validation gate before `save_lead()`. Kills worthless rows at source.

```python
# main.py — scrape loop, fires BEFORE save_lead()
if phone == 'N/A' and website == 'N/A':
    print(f"[SKIP] Dead lead: {place_name}")
    continue

if not address or rating == 'N/A':
    print(f"[SKIP] Incomplete: {place_name}")
    continue
```

One-time historical cleanup:
```sql
DELETE FROM businesses
WHERE phone = 'N/A'
  AND website = 'N/A'
  AND address IS NULL;
```

**Effort:** 2 hrs

---

#### 5.2 — `/api/signals` Endpoint (`backend/server.js`)

Dedicated endpoint for website-enriched leads only. Avoids 502s from joining the full businesses table on heavy loads.

```javascript
app.get('/api/signals', async (req, res) => {
  const { data, error } = await supabase
    .from('website_enrichment')
    .select(`
      *,
      businesses ( id, place_name, industry, city, lead_score, phone )
    `)
    .not('cms_stack', 'is', null)
    .order('seo_score', { ascending: true });  // worst SEO first

  if (error) return res.status(500).json({ error });
  res.json(data);
});
```

**Effort:** 2 hrs

---

#### 5.3 — SEO Signals Tab (`src/pages/SeoSignals.jsx`)

Raw diagnostic view. Every row is a business with a website. Shows signal data directly — no classification yet, that's Phase 6.

| Column | Source Field | Display |
|---|---|---|
| Business | `businesses.place_name` | + industry badge |
| CMS Stack | `cms_stack` | Badge: Shopify=Green, WP=Blue, Wix=Gray, Custom=Purple |
| Google Ads | `has_google_ads` | ✅ Running / ❌ None — **NEW** |
| FB Pixel | `has_fb_pixel` | ✅ Active / ❌ Missing |
| GA Tag | `has_ga` | ✅ Active / ❌ Missing |
| Page Title | `title_quality` | ✅ Descriptive / ⚠ Generic — **NEW** |
| H1 Tag | `has_h1` | ✅ / ⚠ |
| Meta Desc | `has_meta_description` | ✅ / ⚠ |
| Speed Score | `pagespeed_mobile` | 0–100 badge (color-coded) — **NEW** |
| SEO Score | `seo_score` | 0–10 badge — **NEW** |
| Email | `extracted_email` | Clickable mailto |
| Icebreaker | `ai_icebreaker` | 1-click copy |

**Effort:** 6–8 hrs

---

### Phase 6: Website Intelligence Classification Engine
*Adds opportunity classifier, numeric SEO score, and enhanced scraper signals on top of Phase 5 data.*

#### 6.1 — Enhanced Signal Collection (`deep_scraper.py`)

**New signals to capture — GPT additions incorporated here:**

```python
# deep_scraper.py — add these checks after existing signal extraction

# --- GPT Addition 1: Google Ads detection ---
page_html = await page.content()
signals['has_google_ads'] = any(marker in page_html for marker in [
    'adsbygoogle.js',
    "gtag('event'",
    'googlesyndication',
    'googleadservices'
])

# --- GPT Addition 2: Page title quality check ---
title = await page.title()
signals['page_title'] = title
# Generic titles are red flags — "Home", "Index", business name alone
signals['title_quality'] = 'descriptive' if (
    title and
    len(title) > 25 and
    any(kw in title.lower() for kw in ['best', 'top', 'clinic', 'service', 'near', '|', '-'])
) else 'generic'

# --- From V2: Keep all existing checks ---
# has_fb_pixel, has_ga, has_h1, has_meta_description,
# has_ssl, is_mobile_friendly, has_schema_markup, has_contact_page

# --- Resource count as speed proxy (used only if PageSpeed API fails) ---
resource_count = await page.evaluate("performance.getEntriesByType('resource').length")
signals['resource_count'] = resource_count
signals['is_slow_site'] = resource_count > 120
```

---

#### 6.2 — PageSpeed Insights API Integration (`deep_scraper.py`)

**GPT's strongest addition in Round 1.** Free quota: 25,000 requests/day. No billing required if you stay under. Gives real mobile + desktop scores, not a proxy.

```python
import httpx

async def fetch_pagespeed(url: str) -> dict:
    """
    Calls Google PageSpeed Insights API (free, no API key needed for basic use).
    Returns mobile and desktop scores (0-100).
    Falls back to resource_count proxy if API fails.
    """
    api_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    
    scores = {'pagespeed_mobile': None, 'pagespeed_desktop': None}
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Mobile score
            r = await client.get(api_url, params={
                'url': url,
                'strategy': 'mobile',
                'category': 'performance'
            })
            if r.status_code == 200:
                data = r.json()
                scores['pagespeed_mobile'] = int(
                    data['lighthouseResult']['categories']['performance']['score'] * 100
                )
            
            # Desktop score
            r = await client.get(api_url, params={
                'url': url,
                'strategy': 'desktop',
                'category': 'performance'
            })
            if r.status_code == 200:
                data = r.json()
                scores['pagespeed_desktop'] = int(
                    data['lighthouseResult']['categories']['performance']['score'] * 100
                )
    except Exception as e:
        print(f"[PAGESPEED] Failed for {url}: {e} — using resource proxy")
    
    return scores

# Call in deep_scraper after page loads:
speed_scores = await fetch_pagespeed(website_url)
signals.update(speed_scores)
```

> **Important:** PageSpeed API makes a separate HTTP call for each business — add a `asyncio.sleep(1)` between calls to avoid rate limiting. At 1 req/sec for mobile + desktop, budget ~2 seconds per lead.

---

#### 6.3 — Numeric SEO Score Computation (`deep_scraper.py`)

**GPT Round 1 addition.** Replaces vague boolean display with a 0–10 score. Computed after all signals are collected. Higher score = worse SEO.

```python
def compute_seo_score(signals: dict) -> int:
    """
    Penalty-based SEO weakness score. 0 = perfect, 10 = completely broken.
    Higher score = better lead for SEO upsell.
    """
    score = 0

    # Tracking gaps (max 3 pts)
    if not signals.get('has_ga'):          score += 1
    if not signals.get('has_fb_pixel'):    score += 1
    if not signals.get('has_google_ads'):  score += 1  # running no ads at all

    # SEO fundamentals (max 4 pts)
    if not signals.get('has_h1'):                        score += 1
    if not signals.get('has_meta_description'):          score += 1
    if not signals.get('has_schema_markup'):             score += 1
    if signals.get('title_quality') == 'generic':        score += 1

    # Performance & trust (max 3 pts)
    mobile = signals.get('pagespeed_mobile')
    if mobile is not None and mobile < 50:   score += 1
    elif signals.get('is_slow_site'):        score += 1  # fallback proxy
    if not signals.get('has_ssl'):           score += 1
    if not signals.get('is_mobile_friendly'): score += 1

    return min(score, 10)  # cap at 10
```

---

#### 6.4 — Opportunity Classifier (`deep_scraper.py`)

Runs after `compute_seo_score()`. Determines pitch type. Now uses `has_google_ads` in the logic.

```python
def classify_opportunity(signals: dict) -> dict:
    has_pixel      = signals.get('has_fb_pixel', False)
    has_ga         = signals.get('has_ga', False)
    has_google_ads = signals.get('has_google_ads', False)
    has_h1         = signals.get('has_h1', True)
    has_meta       = signals.get('has_meta_description', True)
    seo_score      = signals.get('seo_score', 0)

    # Tier 1: Spending on ads but retargeting is broken → highest urgency
    if (has_ga or has_google_ads) and not has_pixel:
        return {
            'opportunity_type': 'ads_no_retargeting',
            'pitch_angle': 'Running Google Ads without FB Pixel — retargeting revenue is being lost'
        }

    # Tier 2: No tracking at all — completely blind
    if not has_ga and not has_pixel and not has_google_ads:
        return {
            'opportunity_type': 'no_tracking',
            'pitch_angle': 'No GA, no FB Pixel, no Ads — zero visibility into traffic or conversions'
        }

    # Tier 3: Tracking OK but SEO fundamentals weak
    if seo_score >= 4:
        return {
            'opportunity_type': 'tracking_ok_seo_weak',
            'pitch_angle': 'Ads infrastructure exists but basic SEO is broken — losing organic traffic'
        }

    # Tier 4: Functional presence — low priority
    return {
        'opportunity_type': 'well_optimized',
        'pitch_angle': None
    }
```

---

#### 6.5 — Database Schema Additions for Phase 6

```sql
-- New signal columns on website_enrichment
ALTER TABLE website_enrichment
  ADD COLUMN has_google_ads      boolean DEFAULT false,
  ADD COLUMN title_quality       text,        -- 'descriptive' | 'generic'
  ADD COLUMN page_title          text,
  ADD COLUMN pagespeed_mobile    int,         -- 0-100
  ADD COLUMN pagespeed_desktop   int,         -- 0-100
  ADD COLUMN resource_count      int,
  ADD COLUMN is_slow_site        boolean DEFAULT false,
  ADD COLUMN has_ssl             boolean DEFAULT false,
  ADD COLUMN is_mobile_friendly  boolean DEFAULT false,
  ADD COLUMN has_schema_markup   boolean DEFAULT false,
  ADD COLUMN has_contact_page    boolean DEFAULT false,
  ADD COLUMN seo_score           int,         -- 0-10, higher = weaker SEO
  ADD COLUMN opportunity_type    text,        -- classification result
  ADD COLUMN pitch_angle         text;        -- pre-written pitch rationale

-- Index for fast UI filtering
CREATE INDEX idx_opportunity_type ON website_enrichment(opportunity_type);
CREATE INDEX idx_seo_score        ON website_enrichment(seo_score DESC);
```

---

#### 6.6 — Website Intelligence Tab (`src/pages/WebsiteIntelligence.jsx`)

Separate from SeoSignals.jsx. This tab shows classified, actionable segments — not raw signals.

```
┌──────────────────────────────────────────────────────────────────┐
│  WEBSITE INTELLIGENCE         [Industry ▾] [City ▾] [Export CSV] │
├──────────────┬───────────────┬──────────────┬────────────────────┤
│ 🔴 NO TRACK  │ 🟡 ADS/NO PIX │ 🟠 SEO WEAK  │ 🟢 WELL OPTIMIZED  │
│  34 leads    │  18 leads     │  27 leads    │  12 — skip these   │
└──────────────┴───────────────┴──────────────┴────────────────────┘
```

Clicking a segment header filters the table below. Table columns:

| Column | Source | Notes |
|---|---|---|
| Business + City | `businesses` | |
| Opportunity | `opportunity_type` | Color badge |
| SEO Score | `seo_score` | 0–10 badge, red ≥7, amber 4–6, green ≤3 |
| Mobile Speed | `pagespeed_mobile` | 0–100 with color coding |
| Pitch Angle | `pitch_angle` | Pre-written · 1-click copy |
| Google Ads | `has_google_ads` | ✅ / ❌ |
| FB Pixel | `has_fb_pixel` | ✅ / ❌ |
| CMS | `cms_stack` | Badge |
| Icebreaker | `ai_icebreaker` | 1-click copy |
| Action | — | → Add to Campaign (auto-selects template) |

---

#### 6.7 — Templates Table + Opportunity-to-Template Mapping

```sql
CREATE TABLE templates (
  id               text PRIMARY KEY,
  name             text,
  channel          text,          -- 'whatsapp' | 'email'
  opportunity_type text,          -- maps to website_enrichment.opportunity_type
  body             text           -- {{business_name}}, {{ai_icebreaker}}, {{pagespeed_mobile}} tokens
);
```

| opportunity_type | Template Name | Core Hook | Speed Data Used? |
|---|---|---|---|
| `no_tracking` | "Flying Blind" | Zero visibility into traffic or conversions | No |
| `ads_no_retargeting` | "Leaking Revenue" | Ads running, retargeting broken | No |
| `tracking_ok_seo_weak` | "Invisible on Google" | Organic traffic blocked by broken SEO | No |
| `well_optimized` | *(auto-skip)* | Do not enroll — not your buyer | — |

**Example template body using speed data:**
```
Hi {{business_name}} — your site loads in {{pagespeed_mobile}}/100 on mobile.
Top competitors in {{city}} average 72+. {{ai_icebreaker}}
Worth a quick call?
```

---

### Phase 7: Competitor Benchmark Engine *(GPT Round 2 — strongest new addition)*

> **Why this matters:** GPT's best contribution. Your Maps scraper already processes competitor listings during each search — you're throwing away rank data. Storing and computing competitor benchmarks turns your outreach from "your metrics are weak" into "your metrics vs the top 3 near you." The latter closes deals because it creates urgency through a real comparison, not a generic claim.

#### 7.1 — Capture Rank Position During Maps Scrape (`main.py`)

The Maps scraper already iterates through pins in order. Add a counter.

```python
# main.py — inside scrape_google_maps()
for rank_position, pin in enumerate(map_pins, start=1):
    business_data = extract_pin_data(pin)
    business_data['search_query'] = query
    business_data['search_city']  = city
    business_data['rank_position'] = rank_position  # ADD THIS
    save_lead(business_data)
```

Add columns to `businesses`:
```sql
ALTER TABLE businesses
  ADD COLUMN rank_position int,     -- position in Maps search results (1 = top)
  ADD COLUMN search_query  text,    -- e.g. "dentist lucknow"
  ADD COLUMN search_city   text;    -- e.g. "lucknow"
```

---

#### 7.2 — Competitor Gap Computation (`database.py` or Supabase Edge Function)

After a scrape job completes, compute competitor benchmarks for each business against others in the same `search_query` + `search_city` group.

```python
# database.py — call after save_lead() batch completes

async def compute_competitor_gaps(query: str, city: str):
    """
    For each business in this search group, compute how they compare
    to the top 3 competitors by rating and review count.
    """
    # Fetch all businesses from this search
    peers = supabase.table('businesses') \
        .select('id, reviews, rating, lead_score') \
        .eq('search_query', query) \
        .eq('search_city', city) \
        .order('rank_position') \
        .execute().data

    if len(peers) < 2:
        return

    # Top 3 by rank (or by rating if rank unavailable)
    top3 = peers[:3]
    avg_top3_reviews = sum(p['reviews'] or 0 for p in top3) / len(top3)
    avg_top3_rating  = sum(p['rating']  or 0 for p in top3) / len(top3)

    # Fetch speed scores for top 3 if enriched
    top3_ids = [p['id'] for p in top3]
    top3_enriched = supabase.table('website_enrichment') \
        .select('business_id, pagespeed_mobile') \
        .in_('business_id', top3_ids) \
        .execute().data
    
    top3_speeds = [e['pagespeed_mobile'] for e in top3_enriched if e['pagespeed_mobile']]
    avg_top3_speed = sum(top3_speeds) / len(top3_speeds) if top3_speeds else None

    # Write gap data for every business in this search
    for biz in peers:
        review_gap = avg_top3_reviews - (biz['reviews'] or 0)
        rating_gap = avg_top3_rating  - (biz['rating']  or 0)

        supabase.table('competitor_gaps').upsert({
            'business_id':          biz['id'],
            'search_query':         query,
            'search_city':          city,
            'avg_competitor_reviews': round(avg_top3_reviews, 1),
            'avg_competitor_rating':  round(avg_top3_rating, 2),
            'avg_competitor_speed':   round(avg_top3_speed, 1) if avg_top3_speed else None,
            'review_gap':             round(review_gap, 0),
            'rating_gap':             round(rating_gap, 2),
            'computed_at':            'now()'
        }).execute()
```

---

#### 7.3 — Competitor Gaps Table

```sql
CREATE TABLE competitor_gaps (
  id                       bigserial PRIMARY KEY,
  business_id              int8 REFERENCES businesses(id),
  search_query             text,
  search_city              text,
  avg_competitor_reviews   float,
  avg_competitor_rating    float,
  avg_competitor_speed     float,      -- avg pagespeed_mobile of top 3
  review_gap               float,      -- competitor avg - this business
  rating_gap               float,
  computed_at              timestamptz DEFAULT now(),
  UNIQUE(business_id, search_query, search_city)
);
```

---

#### 7.4 — Competitor Data in Outreach Templates

The Chrome extension reads `competitor_gaps` when building messages. Template tokens expand to real numbers.

```
Hi {{business_name}} — I noticed you have {{reviews}} reviews on Google.
The top 3 {{industry}}s in {{city}} average {{avg_competitor_reviews}} reviews.
{{ai_icebreaker}}. Worth a quick 10-minute call this week?
```

This is the difference between "you have few reviews" (generic, ignored) and "you have 12 reviews, your top 3 competitors average 84" (specific, creates urgency, gets replies).

**Effort: 8–10 hrs total for Phase 7**

---

### Phase 8: Sequence Engine + Contacts Table
*Converts the Chrome extension from a manual trigger into a full drip automation engine.*

#### 8.1 — Contacts Table (Contact Identity Layer)

```sql
CREATE TABLE contacts (
  id               bigserial PRIMARY KEY,
  business_id      int8 REFERENCES businesses(id),
  name             text,
  email            text,
  phone            text,
  role             text,          -- 'owner' | 'manager' | 'marketing' | 'unknown'
  source           text,          -- 'about_page' | 'schema_json' | 'mailto_link' | 'manual'
  confidence       int,           -- 0-100, how certain we are this is the right person
  created_at       timestamptz DEFAULT now()
);
```

Extraction logic in `deep_scraper.py`:
```python
# Parse About/Team page for owner names
# Parse schema.org Person markup
# Extract name from mailto: link anchor text
# Confidence: schema.org = 90, mailto anchor = 70, about page parse = 50
```

#### 8.2 — Campaigns + Sequence Steps Tables

```sql
CREATE TABLE campaigns (
  id          bigserial PRIMARY KEY,
  name        text,
  industry    text,
  city        text,
  status      text DEFAULT 'draft',   -- 'draft' | 'active' | 'paused' | 'completed'
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE sequence_steps (
  id           bigserial PRIMARY KEY,
  campaign_id  int8 REFERENCES campaigns(id),
  day_offset   int,                   -- 0=Day 1, 2=Day 3, 6=Day 7
  channel      text,                  -- 'whatsapp' | 'email'
  template_id  text REFERENCES templates(id),
  stop_on_reply boolean DEFAULT true
);

-- Enroll a lead into a campaign
CREATE TABLE campaign_leads (
  campaign_id   int8 REFERENCES campaigns(id),
  lead_id       int8 REFERENCES businesses(id),
  enrolled_at   timestamptz DEFAULT now(),
  status        text DEFAULT 'active',  -- 'active' | 'replied' | 'completed' | 'paused'
  PRIMARY KEY(campaign_id, lead_id)
);
```

Node.js cron job (runs every hour):
```javascript
// Checks campaign_leads + outreach_log to determine next step due
// Writes to pending_outreach for Chrome extension to execute
async function scheduleDueTasks() {
  const activeCampaignLeads = await getActiveCampaignLeads();
  
  for (const enrollment of activeCampaignLeads) {
    const lastSent    = await getLastOutreach(enrollment.lead_id, enrollment.campaign_id);
    const nextStep    = await getNextSequenceStep(enrollment.campaign_id, lastSent);
    const daysSince   = daysBetween(lastSent?.sent_at, new Date());
    
    if (nextStep && daysSince >= nextStep.day_offset) {
      await insertPendingOutreach({
        lead_id:     enrollment.lead_id,
        step_id:     nextStep.id,
        template_id: nextStep.template_id,
        channel:     nextStep.channel,
        scheduled_for: new Date()
      });
    }
  }
}
```

**Effort: 10–12 hrs total for Phase 8**

---

## 📊 Complete Final Database Schema Reference (V3)

```
businesses
├── id, place_name, industry, city, rating, reviews
├── phone, website, address, maps_url
├── lead_score          (0-100, higher = weaker presence = hotter lead)
├── pipeline_status     (scraped|contacted|replied|demo_booked|closed|lost)
├── rank_position       ← Phase 7: position in Maps search
├── search_query        ← Phase 7
├── search_city         ← Phase 7
└── scraped_at

website_enrichment      (1-to-1, only businesses WITH websites)
├── business_id (FK)
├── extracted_email, cms_stack, page_title
├── has_fb_pixel, has_ga, has_google_ads    ← Phase 6 adds has_google_ads
├── has_h1, has_meta_description
├── has_ssl, is_mobile_friendly
├── has_schema_markup, has_contact_page
├── title_quality       ← Phase 6 (descriptive|generic)
├── pagespeed_mobile    ← Phase 6 (0-100 real score)
├── pagespeed_desktop   ← Phase 6 (0-100 real score)
├── resource_count, is_slow_site
├── seo_score           ← Phase 6 (0-10 computed)
├── opportunity_type    ← Phase 6 (classifier output)
├── pitch_angle         ← Phase 6
├── ai_icebreaker
└── enriched_at

competitor_gaps          ← NEW Phase 7
├── business_id (FK)
├── search_query, search_city
├── avg_competitor_reviews, avg_competitor_rating
├── avg_competitor_speed
├── review_gap, rating_gap
└── computed_at

contacts                 ← Phase 8
├── business_id (FK)
├── name, email, phone
├── role, source, confidence
└── created_at

scrape_jobs
├── id, query, city
├── status (pending|running|done|failed)
├── progress, results_count, error_log
└── created_at

outreach_log
├── id, lead_id (FK), campaign_id (FK)
├── channel, template_id, template_variant
├── sent_at, opened_at, reply_detected_at
├── status, ai_firstline, sequence_step
└── created_at

templates
├── id, name, channel
├── opportunity_type
└── body (supports {{tokens}})

campaigns                ← Phase 8
├── id, name, industry, city
├── status
└── created_at

sequence_steps           ← Phase 8
├── campaign_id, day_offset
├── channel, template_id
└── stop_on_reply

campaign_leads           ← Phase 8
├── campaign_id, lead_id
├── status, enrolled_at

pending_outreach         ← Chrome Extension reads this
├── lead_id, step_id, template_id, channel
├── scheduled_for, status
└── created_at
```

---

## 🗺️ Final Execution Priority Order

| Phase | Task | Status | Effort | Unblocks |
|---|---|---|---|---|
| 1 | Async Queue + DB scaffold | ✅ Done | — | Everything |
| 2 | Scoring + Deep Scraper | ✅ Done | — | Phase 6 classifier |
| 3 | Chrome Extension | ✅ Done | — | Sequence automation |
| 4 | Dashboard UI upgrades | ✅ Done | — | Signal display |
| 5.1 | Dead lead filter | 🔲 Next | 2 hrs | Cleaner data |
| 5.2 | `/api/signals` endpoint | 🔲 Next | 2 hrs | SeoSignals tab |
| 5.3 | SeoSignals.jsx tab | 🔲 Next | 6–8 hrs | Raw signal UI |
| 6.1–6.3 | Enhanced scraper signals + PageSpeed + Google Ads | 🔲 Next | 5–6 hrs | Richer classifier |
| 6.4 | SEO score + classifier update | 🔲 Queued | 3 hrs | Intelligence tab |
| 6.5–6.6 | DB schema additions + WebsiteIntelligence.jsx | 🔲 Queued | 9–11 hrs | Pitch workflow |
| 6.7 | Templates table + mapping | 🔲 Queued | 3–4 hrs | Auto template select |
| 7.1–7.2 | Rank capture + competitor gap computation | 🔲 Queued | 5–6 hrs | Benchmark data |
| 7.3–7.4 | competitor_gaps table + template tokens | 🔲 Queued | 3–4 hrs | Competitor messaging |
| 8.1 | Contacts table + extractor | 🔲 Queued | 5–6 hrs | Person-level outreach |
| 8.2 | Campaigns + sequence_steps + cron scheduler | 🔲 Queued | 10–12 hrs | Full drip automation |

**Total remaining: ~60–70 hours of focused development across Phases 5–8.**

---

## ⚠️ What Was Explicitly Rejected From GPT Suggestions

| GPT Suggestion | Reason Rejected |
|---|---|
| LinkedIn scraping for contacts | Requires paid API to automate. Breaks free-tier rule. |
| Redis / BullMQ queue | Overkill for current scale. Supabase polling is sufficient and free. |
| Electron app over Chrome Extension | 150MB+ installer, update distribution overhead. Extension is zero friction — browser is already open for WA Web and Gmail. Graduate to Electron only if multi-account parallel execution is needed. |
| 7-day build timeline | Unrealistic for part-time development. Accurate estimate: 8–10 weeks. |
| "Doubles reply rates" contact claim | Unsubstantiated. Directionally true but no evidence basis. |
