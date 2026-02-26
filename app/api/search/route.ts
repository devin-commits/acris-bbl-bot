import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SearchFormState = {
  maxRent?: string;
  neighborhood?: string;
  hasGuarantor?: "yes" | "no";
  keywords?: string;
};

type Listing = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  priceHint?: string;
  neighborhoodHint?: string;
};

const SERP_API_ENDPOINT = "https://serpapi.com/search.json";

function buildQuery(payload: SearchFormState): string {
  const terms: string[] = [];

  if (payload.neighborhood && payload.neighborhood !== "Any") {
    const neighborhoodLabel = payload.neighborhood.split("(")[0].trim();
    terms.push(`"${neighborhoodLabel}"`);
  } else {
    terms.push('"Manhattan"');
  }

  terms.push('"rent stabilized" OR stabilized OR "income restricted"');
  terms.push('"for rent"');
  terms.push('"apartment" OR "1 bedroom" OR studio');
  terms.push('("NYC" OR "New York City" OR "New York, NY")');

  if (payload.maxRent) {
    terms.push(`"$${payload.maxRent}"`);
  }

  if (payload.keywords) {
    terms.push(`(${payload.keywords})`);
  }

  // Exclude list/guide/inventory pages so we get single-listing results
  terms.push(
    '-"list of" -"best apartments" -"top 10" -"neighborhood guide" -"rental guide" -"how to find" -"apartments for rent in" -inventory -"see all" -"browse"'
  );

  // Only at or below 96th Street (exclude Washington Heights, Inwood, Hamilton Heights)
  terms.push('-"Washington Heights" -"Inwood" -"Hamilton Heights"');

  const sites =
    "(site:streeteasy.com OR site:apartments.com OR site:zillow.com OR site:renthop.com OR site:cityrealty.com)";

  return `${terms.join(" ")} ${sites}`;
}

function extractDomain(url: string | undefined): string {
  if (!url) return "Unknown";
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

function extractPriceHint(text: string): string | undefined {
  const match = text.match(/\$\d{1,3}(?:,\d{3})/);
  return match?.[0];
}

const NEIGHBORHOOD_KEYWORDS = [
  "Harlem",
  "Morningside",
  "Washington Heights",
  "Inwood",
  "Upper West Side",
  "Upper East Side",
  "Midtown",
  "Chelsea",
  "Hell's Kitchen",
  "East Village",
  "West Village",
  "Lower East Side",
  "Soho",
  "Tribeca",
  "Financial District",
];

function extractNeighborhoodHint(text: string): string | undefined {
  const found = NEIGHBORHOOD_KEYWORDS.find((name) =>
    text.toLowerCase().includes(name.toLowerCase())
  );
  return found;
}

/** Reject list/neighborhood/inventory pages; keep only results that look like a single listing. */
function isLikelySingleListing(
  title: string,
  snippet: string,
  url: string
): boolean {
  const lower = `${title} ${snippet}`.toLowerCase();
  const urlLower = url.toLowerCase();

  // List/guide/inventory phrases → exclude
  const excludePhrases = [
    "list of",
    "best rent stabilized",
    "best apartments in",
    "top 10",
    "top 5",
    "neighborhood guide",
    "rental guide",
    "how to find",
    "apartments for rent in ",
    "inventory",
    "see all listings",
    "browse apartments",
    "search apartments",
    "all rent stabilized",
    "rent stabilized apartments in",
    "guide to",
    "neighborhoods in",
    "areas in manhattan",
  ];
  if (excludePhrases.some((p) => lower.includes(p))) return false;

  // URL path segments that usually mean list/guide, not a single listing
  const excludePaths = [
    "/blog/",
    "/guide/",
    "/learn/",
    "/neighborhoods/",
    "/neighborhood/",
    "/area/",
    "/rental-guide/",
    "/how-to",
    "/best-",
  ];
  if (excludePaths.some((p) => urlLower.includes(p))) return false;

  // Single-listing URLs often have an ID or a long path (e.g. /rental/12345 or /homedetails/...)
  // StreetEasy: /rental/123456 or /building/...
  // Zillow: /homedetails/ or /b/
  // Apartments.com: /rental/... or /apartment/...
  const listingPathPatterns = [
    /\/rental\/\d+/i,
    /\/homedetails\//i,
    /\/b\/[^/]+\/\d+/i,
    /\/apartment\/[^/]+-/i,
    /\/listing\//i,
    /\/property\//i,
    /\/unit\//i,
  ];
  const looksLikeListingUrl = listingPathPatterns.some((re) => re.test(url));
  if (looksLikeListingUrl) return true;

  // If title/snippet looks like one unit (e.g. contains a price and "bed" or "bath" or address-like number)
  const hasPrice = /\$\d{1,3}(?:,\d{3})?/.test(lower);
  const hasUnitDetail =
    /\d\s*(?:bed|br|bath|bedroom)/.test(lower) ||
    /studio\b/.test(lower) ||
    /#\d+/.test(lower);
  if (hasPrice && hasUnitDetail) return true;

  // Otherwise allow only if URL has a long path (likely a specific page, not a hub)
  try {
    const path = new URL(url).pathname;
    const segmentCount = path.split("/").filter(Boolean).length;
    return segmentCount >= 2;
  } catch {
    return false;
  }
}

/** Exclude listings that are clearly above 96th Street (only show at or below 96th). */
function isAtOrBelow96th(title: string, snippet: string): boolean {
  const lower = `${title} ${snippet}`.toLowerCase();
  const neighborhoodsAbove96 = [
    "washington heights",
    "inwood",
    "hamilton heights",
  ];
  if (neighborhoodsAbove96.some((n) => lower.includes(n))) return false;
  // Street numbers above 96: 97th–220th (Manhattan grid)
  const streetAbove96 = /\b(9[7-9]|[1-2]\d{2})\s*(?:st|street|th)\b/i;
  if (streetAbove96.test(lower)) return false;
  return true;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing SERP_API_KEY environment variable on server." },
      { status: 500 }
    );
  }

  let payload: SearchFormState;
  try {
    payload = (await req.json()) as SearchFormState;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const q = buildQuery(payload);

  // IMPORTANT: Do NOT pass a `location` param (it was causing "Unsupported ... location").
  // Instead we keep the query Manhattan/NYC-focused and use US + English defaults.
  const params: Record<string, string> = {
    engine: "google",
    q,
    api_key: apiKey,
    hl: "en",
    gl: "us",
    num: "25",
  };

  const searchParams = new URLSearchParams(params);

  try {
    const res = await fetch(`${SERP_API_ENDPOINT}?${searchParams.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          error: `Search API error: ${res.status} ${res.statusText}`,
          details: text.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const data: any = await res.json();
    const organicResults: any[] = Array.isArray(data?.organic_results)
      ? data.organic_results
      : [];

    const listings: Listing[] = organicResults
      .map((item, index: number): Listing | null => {
        const url = item?.link as string | undefined;
        if (!url) return null;

        const title = (item?.title as string | undefined) ?? "Listing";
        const snippet =
          (item?.snippet as string | undefined) ??
          (item?.description as string | undefined) ??
          "";

        if (!isLikelySingleListing(title, snippet, url)) return null;
        if (!isAtOrBelow96th(title, snippet)) return null;

        const combinedText = `${title} ${snippet}`;

        return {
          id: String(item?.position ?? index),
          title,
          url,
          snippet,
          source: extractDomain(url),
          priceHint: extractPriceHint(combinedText),
          neighborhoodHint: extractNeighborhoodHint(combinedText),
        };
      })
      .filter((x: Listing | null): x is Listing => Boolean(x))
      .slice(0, 18);

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Search API failure", error);
    return NextResponse.json(
      { error: "Failed to contact search API. Try again in a moment." },
      { status: 500 }
    );
  }
}

