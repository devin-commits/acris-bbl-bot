'use client';

import { useEffect, useMemo, useState } from 'react';

type Neighborhood =
  | 'Any'
  | 'Upper Manhattan (Washington Heights / Inwood)'
  | 'Harlem / Morningside'
  | 'Upper West Side'
  | 'Upper East Side'
  | 'Midtown'
  | 'Lower Manhattan';

type Listing = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  priceHint?: string;
  neighborhoodHint?: string;
  isNew?: boolean;
};

type SearchFormState = {
  maxRent: string;
  neighborhood: Neighborhood;
  hasGuarantor: 'yes' | 'no';
  keywords: string;
};

const SAVED_KEY = 'rent-stabilized-saved';

export default function HomePage() {
  const [form, setForm] = useState<SearchFormState>({
    maxRent: '',
    neighborhood: 'Any',
    hasGuarantor: 'yes',
    keywords: 'rent stabilized, stabilized, income restricted'
  });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Listing[]>([]);
  const [saved, setSaved] = useState<Listing[]>([]);
  const [keepSearching, setKeepSearching] = useState(false);
  const [nextSearchIn, setNextSearchIn] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(SAVED_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Listing[];
      setSaved(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  }, [saved]);

  const hasResults = results.length > 0;

  const neighborhoodSummary = useMemo(() => {
    if (form.neighborhood === 'Any') {
      return 'Focus on larger prewar rentals across Manhattan, especially 6+ unit buildings built before 1974.';
    }
    if (form.neighborhood === 'Upper Manhattan (Washington Heights / Inwood)') {
      return 'Tons of stabilized stock, especially in big prewar elevator buildings. Great value if your commute allows it.';
    }
    if (form.neighborhood === 'Harlem / Morningside') {
      return 'Mix of classic prewar rentals and newer product; many stabilized units in older walk-ups and larger rentals.';
    }
    if (form.neighborhood === 'Upper West Side') {
      return 'Many prewar rental buildings with a long history of stabilization; expect higher asking rents but solid long-term value.';
    }
    if (form.neighborhood === 'Upper East Side') {
      return 'Lots of big rental buildings east of Lexington; stabilized one-beds and studios appear regularly if you move quickly.';
    }
    if (form.neighborhood === 'Midtown') {
      return 'Fewer obviously stabilized deals, but large prewar towers and older rentals can still hide stabilized units.';
    }
    if (form.neighborhood === 'Lower Manhattan') {
      return 'Inventory is thinner and more condo/co-op heavy, but some older rentals still have regulated units tucked away.';
    }
    return '';
  }, [form.neighborhood]);

  const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  async function runSearch(merge: boolean) {
    setIsSearching(true);
    setError(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Search failed');
      }
      const data = (await res.json()) as { listings: Listing[] };
      const next = data.listings.map((l) => ({ ...l, id: l.url }));

      if (merge) {
        setResults((prev) => {
          const prevByUrl = new Map(prev.map((p) => [p.url, p]));
          const newListings: Listing[] = [];
          const fromThisRun: Listing[] = [];
          next.forEach((l) => {
            const entry = { ...l, id: l.url };
            if (!prevByUrl.has(l.url)) {
              newListings.push({ ...entry, isNew: true });
            } else {
              fromThisRun.push(entry);
            }
          });
          const onlyInPrev = prev.filter((p) => !next.some((n) => n.url === p.url));
          return [...newListings, ...fromThisRun, ...onlyInPrev];
        });
      } else {
        setResults(next);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(
        msg.includes('SERP_API_KEY')
          ? 'Server is missing SERP_API_KEY. Add it to your .env.local file and restart.'
          : msg
      );
    } finally {
      setIsSearching(false);
      if (merge) setNextSearchIn(POLL_INTERVAL_MS / 1000);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(false);
  }

  // Auto-refresh when "Keep searching" is on
  useEffect(() => {
    if (!keepSearching) {
      setNextSearchIn(null);
      return;
    }
    setNextSearchIn(POLL_INTERVAL_MS / 1000);
    const run = () => runSearch(true);
    run(); // run once immediately when toggled on
    const interval = setInterval(run, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [keepSearching]);

  // Countdown for next auto-search
  useEffect(() => {
    if (nextSearchIn === null || nextSearchIn <= 0) return;
    const t = setInterval(() => {
      setNextSearchIn((n) => (n === null || n <= 1 ? null : n - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [keepSearching, nextSearchIn]);

  function toggleSave(listing: Listing) {
    setSaved((prev) => {
      const exists = prev.some((x) => x.id === listing.id);
      if (exists) {
        return prev.filter((x) => x.id !== listing.id);
      }
      return [listing, ...prev];
    });
  }

  function isSaved(listing: Listing) {
    return saved.some((x) => x.id === listing.id);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 pb-10 pt-8 md:gap-8 md:px-6 lg:pt-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="pill mb-3 w-fit bg-slate-900/80 text-xs text-slate-300">
            Manhattan · Rent Stabilized · Strategy Tool
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
            Find rent‑stabilized apartments in Manhattan like it&apos;s your job.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            This app treats stabilized hunting like a volume game: it cross‑references{' '}
            <span className="font-medium text-slate-100">stabilized‑heavy neighborhoods</span> with
            listings that mention &ldquo;rent stabilized&rdquo;, &ldquo;stabilized&rdquo;, or
            &ldquo;income restricted&rdquo; and lets you{' '}
            <span className="font-medium text-slate-100">save a hit list</span> to attack with your
            paperwork ready.
          </p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] md:items-start">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Search strategy
            </h2>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Step 1–3: Target &amp; filter
            </span>
          </div>
          <form onSubmit={handleSearch} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-300">
                Max monthly rent (approx)
                <input
                  className="input mt-1.5"
                  type="number"
                  min={500}
                  step={50}
                  placeholder="e.g. 2800"
                  value={form.maxRent}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxRent: e.target.value
                    }))
                  }
                />
              </label>
              <label className="text-xs font-medium text-slate-300">
                Neighborhood focus
                <select
                  className="input mt-1.5"
                  value={form.neighborhood}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      neighborhood: e.target.value as Neighborhood
                    }))
                  }
                >
                  <option value="Any">Any Manhattan</option>
                  <option value="Upper Manhattan (Washington Heights / Inwood)">
                    Upper Manhattan · Washington Heights / Inwood
                  </option>
                  <option value="Harlem / Morningside">Harlem / Morningside</option>
                  <option value="Upper West Side">Upper West Side</option>
                  <option value="Upper East Side">Upper East Side</option>
                  <option value="Midtown">Midtown</option>
                  <option value="Lower Manhattan">Lower Manhattan</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <label className="text-xs font-medium text-slate-300">
                Text filters (description search)
                <input
                  className="input mt-1.5"
                  type="text"
                  value={form.keywords}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      keywords: e.target.value
                    }))
                  }
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Used to scan listings for clues like &ldquo;rent stabilized&rdquo; / &ldquo;income
                  restricted&rdquo;.
                </p>
              </label>

              <fieldset className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                <legend className="px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Income &amp; guarantor
                </legend>
                <p className="mt-1 text-[11px] text-slate-400">
                  Most stabilized landlords still look for ~40× rent or a strong guarantor.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className={`btn-ghost flex-1 ${
                      form.hasGuarantor === 'yes'
                        ? 'border-brand-400 bg-brand-500/20 text-brand-50'
                        : ''
                    }`}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        hasGuarantor: 'yes'
                      }))
                    }
                  >
                    I have a guarantor
                  </button>
                  <button
                    type="button"
                    className={`btn-ghost flex-1 ${
                      form.hasGuarantor === 'no'
                        ? 'border-brand-400 bg-brand-500/20 text-brand-50'
                        : ''
                    }`}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        hasGuarantor: 'no'
                      }))
                    }
                  >
                    No guarantor
                  </button>
                </div>
              </fieldset>
            </div>

            {neighborhoodSummary && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2.5 text-xs text-slate-300">
                <span className="mr-2 font-semibold text-slate-100">Neighborhood note:</span>
                {neighborhoodSummary}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-100">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSearching}
                >
                  {isSearching ? 'Scanning listings…' : 'Scan the web for leads'}
                </button>
                <p className="hidden text-[11px] text-slate-500 sm:block">
                  Uses a search API to look across major listing sites. Always confirm legal
                  stabilization via rent history with NYS HCR.
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={keepSearching}
                  onChange={(e) => setKeepSearching(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-slate-200">
                  Keep searching
                </span>
                <span className="text-xs text-slate-400">
                  Run search every 5 min and add new listings until you find the one. Only shows at or below 96th St.
                </span>
              </label>
              {keepSearching && (
                <p className="text-[11px] text-slate-400">
                  {isSearching
                    ? 'Scanning…'
                    : nextSearchIn != null
                      ? `Next scan in ${Math.floor(nextSearchIn / 60)}:${String(nextSearchIn % 60).padStart(2, '0')}`
                      : 'Idle'}
                </p>
              )}
            </div>
          </form>
        </div>

        <aside className="card max-h-[560px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Saved building hit list
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                Step 2: keep a tight list of addresses you&apos;ll hit quickly once something opens
                up.
              </p>
            </div>
            <span className="pill">
              {saved.length === 0 ? 'Empty' : `${saved.length} saved`}
            </span>
          </div>
          <div className="flex max-h-[460px] flex-col gap-0 overflow-y-auto px-4 py-3">
            {saved.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 px-4 py-10 text-center text-xs text-slate-400">
                When you see a promising listing, tap &ldquo;Save&rdquo; to add it here. Use this
                as your callback list and paperwork blitz queue.
              </div>
            ) : (
              saved.map((listing) => (
                <div
                  key={listing.id}
                  className="mb-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <a
                        href={listing.url}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-2 font-semibold text-slate-50 hover:text-brand-300"
                      >
                        {listing.title}
                      </a>
                      <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                        {listing.snippet}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost shrink-0 px-2 py-1 text-[10px]"
                      onClick={() => toggleSave(listing)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    <span className="pill border-slate-700/60 bg-slate-900/80">
                      {listing.source}
                    </span>
                    {listing.priceHint && (
                      <span className="pill border-emerald-600/40 bg-emerald-900/30 text-emerald-100">
                        {listing.priceHint}
                      </span>
                    )}
                    {listing.neighborhoodHint && (
                      <span className="pill border-sky-600/40 bg-sky-900/30 text-sky-100">
                        {listing.neighborhoodHint}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      <section className="card mt-2 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Live listing leads
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Step 3–4: filter platforms, scan for stabilized language, and star anything that fits
              your rent and income bands.
            </p>
          </div>
          <span className="pill">
            {isSearching ? 'Scanning…' : hasResults ? `${results.length} matches` : 'No results yet'}
          </span>
        </div>
        <div className="grid gap-4 px-4 py-4 md:grid-cols-2 lg:grid-cols-3">
          {!hasResults && !isSearching && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-10 text-center text-sm text-slate-400">
              Start with a neighborhood and rough max rent, then hit{' '}
              <span className="font-semibold text-slate-100">“Scan the web for leads”</span>. You
              can refine from there and star the buildings worth chasing.
            </div>
          )}
          {results.map((listing) => (
            <article
              key={listing.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-100 shadow-lg shadow-slate-950/40"
            >
              <div>
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noreferrer"
                  className="line-clamp-2 text-sm font-semibold text-slate-50 hover:text-brand-300"
                >
                  {listing.title}
                </a>
                <p className="mt-2 line-clamp-3 text-xs text-slate-300">{listing.snippet}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="pill border-slate-700/70 bg-slate-900/90">
                    {listing.source}
                  </span>
                  {listing.priceHint && (
                    <span className="pill border-emerald-500/50 bg-emerald-900/40 text-emerald-100">
                      {listing.priceHint}
                    </span>
                  )}
                  {listing.neighborhoodHint && (
                    <span className="pill border-sky-500/40 bg-sky-900/40 text-sky-100">
                      {listing.neighborhoodHint}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className={`btn-ghost text-[11px] ${
                    isSaved(listing)
                      ? 'border-brand-400 bg-brand-500/10 text-brand-100'
                      : ''
                  }`}
                  onClick={() => toggleSave(listing)}
                >
                  {isSaved(listing) ? 'Saved' : 'Save'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

