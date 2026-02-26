## Manhattan Rent‑Stabilized Finder

**Goal:** Help you hunt for likely rent‑stabilized apartments in Manhattan by treating it like a volume/data game: target stabilized‑heavy buildings/neighborhoods, scan the major listing platforms for stabilized clues, and keep a tight saved hit list you can blitz with applications.

This is a small Next.js + Tailwind web app with:

- **Home page with welcome header** describing the strategy.
- **Search panel** where you set max rent, neighborhood focus, and text filters like “rent stabilized”, “stabilized”, “income restricted”.
- **Live web search backend** that calls a search API (SerpAPI) against major listing sites (StreetEasy, Zillow, Apartments.com, etc.).
- **Saved section** where you can pin promising listings; they are persisted in `localStorage` for quick recall.

---

### Tech stack

- **Next.js 13+ (App Router)**
- **React + TypeScript**
- **Tailwind CSS** for a clean, modern dark UI

---

### Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   The app uses [SerpAPI](https://serpapi.com) to perform Google‑style searches over major listing sites. Create a free account and grab your **API key**, then create a `.env.local` file in the project root:

   ```bash
   cp .env.example .env.local
   # Then edit .env.local and set:
   # SERP_API_KEY=your_real_key_here
   ```

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Then open `http://localhost:3000` in your browser.

---

### How the search works

When you hit **“Scan the web for leads”**:

- The frontend sends your **max rent, neighborhood focus, and keywords** to `/api/search`.
- The backend:
  - Builds a query that targets **Manhattan** (and your chosen neighborhood when set).
  - Adds stabilized‑oriented terms like **“rent stabilized”, “stabilized”, “income restricted”**.
  - Limits results to **major listing platforms**, e.g. `streeteasy.com`, `zillow.com`, `apartments.com`, `renthop.com`, `cityrealty.com`.
  - Calls **SerpAPI** with that query to fetch live organic results.
- Results are normalized into simple cards with:
  - **Title + link** (opens the original listing in a new tab).
  - **Snippet** (the search result description).
  - **Source** (domain like `streeteasy.com`).
  - A **price hint** and **neighborhood hint** extracted from the text when present.

This gives you a quick, AI‑assisted list of likely stabilized or income‑restricted listings to investigate further.

> ⚠ **Always verify legal stabilization.** Once you’re serious about a unit, request the official rent history from NYS HCR (DHCR) to confirm that it’s legally stabilized and that the “legal rent” is correct.

---

### Saved section

- Any listing card can be toggled between **Saved** and **Unsaved**.
- Saved items appear in the **“Saved building hit list”** panel on the right.
- Saved data is stored in the browser’s `localStorage`, so it survives refreshes on the same device/browser.

Use this like a personal **callback + paperwork blitz list**:

- Pre‑assemble your standard “packet” (pay stubs, bank statements, ID, guarantor info).
- As you save listings, you have a prioritized list of buildings and units to contact quickly.

---

### Customization ideas

- **Add filters** for number of bedrooms or building amenities (elevator, laundry, etc.).
- **Integrate NYC stabilized‑building lists** (e.g., via RSBL or official state CSVs) and highlight when a result matches a known stabilized building.
- **Notifications/alerts** for new hits given a saved query profile.

---

### Scripts

- `npm run dev` – start the local dev server.
- `npm run build` – create a production build.
- `npm run start` – run the production server.

