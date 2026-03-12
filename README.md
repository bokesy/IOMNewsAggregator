# Isle of Man Government News Aggregator

A single HTML file that pulls together news releases from the Isle of Man Government and the Department for Enterprise, presented in a clean, searchable, filterable interface. No frameworks, no build tools, no server required — just open the HTML file in a browser.

---

## How It Works

Because browsers block direct requests to third-party websites (CORS policy), a small server-side proxy is needed to fetch content from gov.im and iomdfenterprise.im on your behalf. This is handled by a **Cloudflare Worker** — a free, serverless script that runs in the cloud and acts as the middleman.

```
Your browser  →  Cloudflare Worker  →  gov.im / iomdfenterprise.im
              ←  (with CORS headers) ←  (HTML content)
```

The Worker also sets browser-like request headers, which prevents the sites' Web Application Firewall (WAF) from blocking the request.

---

## Files

| File | Purpose |
|------|---------|
| `iom-news.html` | The website. Open this in any browser. |
| `cloudflare-worker.js` | The proxy script. Deploy this to Cloudflare Workers. |
| `README.md` | This file. |

---

## Setup

### Step 1 — Create a Cloudflare Account

Go to [workers.cloudflare.com](https://workers.cloudflare.com) and sign up for a free account. No credit card is required. The free tier allows up to 100,000 requests per day, which is more than sufficient for personal use.

### Step 2 — Create a New Worker

1. Once logged in, click **Workers & Pages** in the left sidebar
2. Click **Create** then **Create Worker**
3. When prompted to choose a template, select **Hello World** — this is the simplest blank template
4. Give the worker a name (e.g. `iom-news`) and click **Deploy**

### Step 3 — Paste the Worker Code

1. After deploying, click **Edit code** (or open the worker and click the **< > Edit** button)
2. Select all the existing code in the editor and delete it
3. Open `cloudflare-worker.js` in a text editor, select all, and copy it
4. Paste it into the Cloudflare editor
5. Click **Deploy** (top right)

### Step 4 — Copy Your Worker URL

After deploying you will see a URL at the top of the page in the format:

```
https://iom-news.YOUR-ACCOUNT-NAME.workers.dev
```

Copy this URL — you will need it in the next step.

### Step 5 — Update the HTML File

1. Open `iom-news.html` in a text editor
2. Find this line near the top of the `<script>` section (around line 290):

```javascript
const WORKER_URL = 'https://autumn-credit-6aaf.rob-mercer.workers.dev/';
```

3. Replace the URL with your own Worker URL from Step 4
4. Save the file

### Step 6 — Open the Website

Open `iom-news.html` in any modern web browser (Chrome, Firefox, Edge, Safari). The page will start loading news automatically.

---

## Using the Website

### Year Selector

The dropdown at the top left controls which year's news is loaded.

- **Current year (e.g. 2026 (current))** — fetches news month by month from January through to the current month, from both gov.im and the Department for Enterprise. Both sources are fetched in parallel.
- **Previous years (2020–2025)** — fetches archived news from gov.im only (DfE has no date-based archive). Pages are fetched automatically until all articles for the year have been retrieved.

Year data is cached after the first load, so switching back to a year you have already viewed is instant.

### Category Filter

Category tags appear automatically based on the articles loaded. Click any tag to filter to that category. Categories are inferred from article titles using keyword matching. Articles from the Department for Enterprise are always tagged as **Business**.

### Keyword Search

The search box filters articles in real time by title and description. Search terms are highlighted in yellow in the results. Keyword search and category filter work together — both are applied simultaneously.

### Clearing Filters

When filters are active a **Clear filters** link appears in the results bar. Click it to reset both the category and keyword filters.

### Source Badge

Articles from the Department for Enterprise show a dark blue **DfE** badge next to the title so you can tell at a glance which source they came from.

---

## News Sources

### Isle of Man Government — gov.im

- **Current year:** fetched month by month via `https://www.gov.im/news/{year}/{month}/`
- **Archive years:** fetched page by page via `https://www.gov.im/news/{year}/` and `?page=2`, `?page=3` etc. until no further pages exist
- Articles include date, category, and a short excerpt where available
- Dates are extracted from the URL structure (e.g. `/news/2025/mar/10/`)

### Department for Enterprise — iomdfenterprise.im

- Fetched from `https://www.iomdfenterprise.im/news-events/` and subsequent pages
- Only included when the current year is selected — there is no date-based archive
- Dates are extracted from visible date text near each article link where present; articles without a detectable date sort to the bottom of the list
- All DfE articles are categorised as **Business**

---

## How the Cloudflare Worker Works

The Worker accepts two query parameters:

| Parameter | Values | Description |
|-----------|--------|-------------|
| `site` | `gov` (default) or `dfe` | Which website to fetch from |
| `path` | Any path on that site | The specific URL path to fetch |

Examples:

```
# Fetch the current gov.im news feed
https://your-worker.workers.dev/?site=gov&path=/news/RssNews

# Fetch March 2026 news from gov.im
https://your-worker.workers.dev/?site=gov&path=/news/2026/mar/

# Fetch page 3 of 2023 archive
https://your-worker.workers.dev/?site=gov&path=/news/2023/?page=3

# Fetch DfE news page 2
https://your-worker.workers.dev/?site=dfe&path=/news-events/?page=2
```

The Worker adds browser-like headers (`User-Agent`, `Accept`, `Referer` etc.) to each request so the target sites' WAF treats it as a normal browser visit. It also adds CORS headers to the response so your local HTML file is permitted to receive the data.

Responses are cached by Cloudflare for one hour, reducing the number of outbound requests on repeated loads.

---

## Troubleshooting

**The page loads but shows no articles**

Test your Worker directly by opening its URL in a browser. You should see raw HTML from gov.im. If you see an error message instead, the Worker may need redeploying.

**The Worker URL is not set**

If the HTML still contains `WORKER_URL_HERE`, you have not completed Step 5. Open the file in a text editor and replace the placeholder with your Worker URL.

**Articles from a previous year are missing or incomplete**

Some archive year pages may have changed structure. The page parser looks for anchor links matching `/news/20...` — if gov.im restructures their site this selector may need updating.

**DfE articles have no date**

The DfE website does not embed dates in article URLs. Dates are extracted from visible text near each link. If the page layout changes, dates may not be detected and affected articles will appear at the bottom of the list.

**Categories look wrong**

Categories are inferred from article titles using keyword rules. They will never be perfect without full article text. If a category is consistently wrong, the keyword rules in the `inferCategory` function in `iom-news.html` can be adjusted.

---

## Technical Notes

- No external libraries or frameworks are used — the page is plain HTML, CSS, and JavaScript
- No data is stored anywhere — everything is fetched fresh on each page load (with Cloudflare's one-hour cache)
- The Cloudflare free tier has a limit of 100,000 Worker requests per day and 10ms CPU time per request, both of which are unlikely to be exceeded in normal use
- The Worker does not log or store any request data beyond Cloudflare's standard analytics
