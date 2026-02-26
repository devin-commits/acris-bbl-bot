import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type SearchFormState = {
  maxRent?: string;
  neighborhood?: string;
  hasGuarantor?: 'yes' | 'no';
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

const SERP_API_ENDPOINT = 'https://serpapi.com/search.json';

function buildQuery(payload: SearchFormState): string {
  const terms: string[] = [];

  if (payload.neighborhood && payload.neighborhood !== 'Any') {
    const neighborhoodLabel = payload.neighborhood.split('(')[0].trim();
    terms.push(`"${neighborhoodLabel}"`);
  } else {
    terms.push('"Manhattan"');
  }

  terms.push('"rent stabilized" OR stabilized OR "income restricted"');
  terms.push('"apartment" OR "1 bedroom" OR studio');
  terms.push('("NYC" OR "New York City" OR "New York, NY")');

  if (payload.maxRent) {
    terms.push(`"$${payload.maxRent}"`);
  }

  if (payload.keywords) {
    terms.push(`(${payload.keywords})`);
  }

  const sites =
    '(site:streeteasy.com OR site:apartments.com OR site:zillow.com OR site:renthop.com OR site:cityrealty.com)';

  return `${terms.join(' ')} ${sites}`;
}

function extractDomain(url: string | undefined): string {
  if (!url) return 'Unknown';
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown';
  }
}

function extractPriceHint(text: string): string | undefined {
  const match = text.match(/\$\d{1,3}(?:,\d{3})/);
  return match?.[0];
}

const NEIGHBORHOOD_KEYWORDS = [
  'Harlem',
  'Morningside',
  'Washington Heights',
  'Inwood',
  'Upper West Side',
  'Upper East Side',
  'Midtown',
  'Chelsea',
  'Hell\'s Kitchen',
  'East Village',
  'West Village',
  'Lower East Side',
  'Soho',
  'Tribeca',
  'Financial District'
];

function extractNeighborhoodHint(text: string): string | undefined {
  const found = NEIGHBORHOOD_KEYWORDS.find((name) => text.toLowerCase().includes(name.toLowerCase()));
  return found;
}

export async function POST(req: NextRequest) {
  if (!process.env.SERP_API_KEY) {
    return NextResponse.json(
      { error: 'Missing SERP_API_KEY environment variable on server.' },
      { status: 500 }
    );
  }

  let payload: SearchFormState;
  try {
    payload = (await req.json()) as SearchFormState;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const query = buildQuery(payload);

  const searchParams = new URLSearchParams({
    engine: 'google',
    q: query,
    location: 'Manhattan, New York, NY',
    hl: 'en',
    num: '20',
    api_key: process.env.SERP_API_KEY
  });

  try {
    const res = await fetch(`${SERP_API_ENDPOINT}?${searchParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Search API error: ${res.status} ${res.statusText}`, details: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const data: unknown = await res.json();
    const organicResults: unknown[] =
      typeof data === 'object' &&
      data !== null &&
      'organic_results' in data &&
      Array.isArray((data as any).organic_results)
        ? ((data as any).organic_results as unknown[])
        : [];

    const listings: Listing[] = organicResults
      .map((raw, index: number): Listing | null => {
        const item = raw as any;
        const url = item.link as string | undefined;
        if (!url) return null;

        const title = (item.title as string | undefined) ?? 'Listing';
        const snippet =
          (item.snippet as string | undefined) ??
          (item.description as string | undefined) ??
          '';

        const combinedText = `${title} ${snippet}`;

        return {
          id: String(item.position ?? index),
          title,
          url,
          snippet,
          source: extractDomain(url),
          priceHint: extractPriceHint(combinedText),
          neighborhoodHint: extractNeighborhoodHint(combinedText)
        };
      })
      .filter((x: Listing | null): x is Listing => Boolean(x))
      .slice(0, 18);

    return NextResponse.json({ listings });
  } catch (error) {
    console.error('Search API failure', error);
    return NextResponse.json(
      { error: 'Failed to contact search API. Try again in a moment.' },
      { status: 500 }
    );
  }
}

