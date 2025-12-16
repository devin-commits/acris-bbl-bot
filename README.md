# ACRIS BBL Bot

Node.js + TypeScript CLI that automates the NYC ACRIS parcel lookup workflow, captures document details by BBL, and summarises likely development-rights transactions.

## Prerequisites

- Node.js 18+
- npm
- Playwright browser binaries (`npx playwright install`)
- In some environments you may also need `sudo npx playwright install-deps` (see Playwright warning output).

## Installation

```bash
npm install
npx playwright install
```

## Usage

```bash
npm run scrape -- --bbl 1007840054 [--headful] [--out ./data] [--timeout 60000]
```

- `--bbl` (required) 10-digit Borough/Block/Lot identifier.
- `--headful` opens the Chromium session for debugging.
- `--out` controls the output directory (default `./data`).
- `--timeout` overrides default navigation timeout (45s).

### Separation of responsibilities

1. `npm run scrape -- --bbl <BBL>` (Playwright)
   - Drives the live ACRIS UI, paginates search results, downloads TIFF/PDF/image assets, and runs OCR via Tesseract.
   - Emits raw metadata to `data/<BBL>.json` plus a CSV at `data/<BBL>.csv`.
   - Writes each document’s OCR output to `data/<BBL>/docs/<DOC_ID>/all.txt` alongside per-page artifacts and viewer logs.
   - Does **not** call Gemini or any AI helpers; it only scrapes/OCRs.
2. `npm run gemini:extract -- <BBL>` (Gemini layer)
   - Reads the files generated above (metadata JSON/CSV and `all.txt` OCR text).
   - Calls the Gemini v1beta HTTP endpoint using `GOOGLE_API_KEY`/`GEMINI_API_KEY`.
   - Writes `data/<BBL>/docs/<DOC_ID>/gemini.json` plus diagnostic files (`gemini_error.txt`, `gemini_raw.txt` when parsing fails).
3. `npm run gemini:aggregate`
   - Walks every `data/<BBL>/docs/*/gemini.json` and rebuilds `data/gemini_master.csv` so you have a single summary across BBLs.

### What gets produced

- `./data/<BBL>.json` full scrape payload including metadata.
- `./data/<BBL>.csv` flat summary for spreadsheets.
- `./data/<BBL>/docs/` any PDF/TIFF assets downloaded per document.
- Console output in the format:  
  `ZLDA | $12,500,000 | 32,450 SF | Recipient: 123 Main St | DocID: 2022012301234`

### Keyword tuning

Development-rights heuristics live in `src/extract.ts` (`KEYWORD_PATTERNS`).  
Add/adjust regex entries to broaden or narrow which documents are considered matches.

## Development

```bash
# type-check and emit JS
npm run build

# run Vitest unit tests
npm test

# lint sources
npm run lint

# iterate locally without building
npm run dev -- --bbl 1007840054 --headful
```

## Notes

- The scraper uses Playwright with randomized waits to reduce the chance of ACRIS throttling.
- Downloads fall back gracefully; failures are recorded in the JSON artifact without stopping the run.
- Review `playwright install` output for any missing system libraries (e.g. `libnss3`, `libasound2`).

## Gemini integration

Set a Gemini API key in your environment (or `.env`) to let both the scraper and standalone Gemini tools use Google AI Studio:

```bash
echo "GEMINI_API_KEY=your-google-ai-studio-key" >> .env
# optional: override model (default gemini-1.5-pro)
echo "GEMINI_MODEL=gemini-1.5-pro-exp" >> .env
```

### Headless Gemini passes

Once a BBL has been scraped and OCR files exist under `data/<BBL>/docs/<DOC_ID>/all.txt`, run:

```bash
npm run gemini:extract -- <BBL>
```

- Each document is sent to Gemini exactly once and the structured output is saved to `data/<BBL>/docs/<DOC_ID>/gemini.json`.
- When a document lacks OCR text the script logs and skips it.
- Failures emit `gemini_error.txt` (and `gemini_raw.txt` when the response is non-JSON) to help with debugging.
- The Gemini script only reads the locally scraped OCR/text artifacts; it never opens browsers or touches ACRIS directly.

Aggregate all completed `gemini.json` files into a single CSV:

```bash
npm run gemini:aggregate
```

This produces `data/gemini_master.csv` summarizing the doc type, date, square-foot transfers, consideration, and notes per document.
