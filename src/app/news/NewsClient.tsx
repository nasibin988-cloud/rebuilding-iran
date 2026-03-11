'use client';

import { useState, useEffect, useCallback, useRef } from 'react';


type Bias = -3 | -2 | -1 | 0 | 1 | 2 | 3;

type Relevance = 1 | 2 | 3;

interface FeedItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description: string;
  paywall?: boolean;
  summary?: string;
  bias: Bias;
  relevance: Relevance;
}

const BIAS_LABELS: Record<Bias, string> = {
  [-3]: 'Far Left',
  [-2]: 'Left',
  [-1]: 'Lean Left',
  [0]: 'Center',
  [1]: 'Lean Right',
  [2]: 'Right',
  [3]: 'Far Right',
};

const BIAS_COLORS: Record<Bias, string> = {
  [-3]: 'bg-blue-600 text-blue-100',
  [-2]: 'bg-blue-500/80 text-blue-100',
  [-1]: 'bg-blue-400/60 text-blue-100',
  [0]: 'bg-dark-600 text-dark-200',
  [1]: 'bg-red-400/60 text-red-100',
  [2]: 'bg-red-500/80 text-red-100',
  [3]: 'bg-red-600 text-red-100',
};

function BiasIndicator({ bias }: { bias: Bias }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${BIAS_COLORS[bias]}`}
      title={`Media bias: ${BIAS_LABELS[bias]}`}
    >
      {BIAS_LABELS[bias]}
    </span>
  );
}

const RELEVANCE_CONFIG: Record<Relevance, { label: string; color: string; dots: number }> = {
  3: { label: 'Iran Direct', color: 'text-saffron-400', dots: 3 },
  2: { label: 'Regional', color: 'text-persian-400', dots: 2 },
  1: { label: 'Peripheral', color: 'text-dark-500', dots: 1 },
};

function RelevanceIndicator({ relevance }: { relevance: Relevance }) {
  const cfg = RELEVANCE_CONFIG[relevance];
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${cfg.color}`}
      title={`Relevance: ${cfg.label}`}
    >
      {Array.from({ length: 3 }, (_, i) => (
        <span
          key={i}
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            i < cfg.dots ? 'bg-current' : 'bg-dark-700'
          }`}
        />
      ))}
    </span>
  );
}

type FeedTab = 'en' | 'fa' | 'telegram';

const TAB_OPTIONS: { value: FeedTab; label: string; farsi?: boolean }[] = [
  { value: 'en', label: 'English Media' },
  { value: 'fa', label: 'رسانه فارسی', farsi: true },
  { value: 'telegram', label: 'Telegram' },
];

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const hasFarsi = (text: string) => /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

export default function NewsClient() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<FeedTab>('en');
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const tabRef = useRef(activeTab);
  tabRef.current = activeTab;

  const loadFeeds = useCallback(async (tab: FeedTab = 'en', silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const type = tab === 'telegram' ? 'telegram' : 'rss';
      const lang = tab === 'telegram' ? 'all' : tab;
      const res = await fetch(`/api/news?type=${type}&lang=${lang}`);
      if (!res.ok) throw new Error('Failed to fetch news feeds');
      const data = await res.json();
      setItems(data.items || []);
      if (data.lastRefresh) setLastRefresh(data.lastRefresh);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setItems([]);
      }
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    loadFeeds(activeTab);
  }, [loadFeeds, activeTab]);

  // Auto-refresh every 5 minutes to match server cron
  useEffect(() => {
    const interval = setInterval(() => {
      loadFeeds(tabRef.current, true);
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadFeeds]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedItem(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const sources = Array.from(new Set(items.map((i) => i.source)));
  const filtered =
    sourceFilter === 'all'
      ? items
      : items.filter((i) => i.source === sourceFilter);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  };

  const truncate = (text: string, maxLen: number) => {
    const clean = stripHtml(text);
    if (clean.length <= maxLen) return clean;
    return clean.slice(0, maxLen).replace(/\s+\S*$/, '') + '...';
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-dark-800/60 backdrop-blur-xl bg-dark-950/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-extralight tracking-tight text-dark-100">News</h1>
            <span className="text-sm text-dark-300 bg-gradient-to-r from-persian-600/20 to-crimson-600/20 border border-persian-500/20 rounded-2xl px-5 py-2">
              {(() => {
                // Use server refresh time if available, otherwise compute 5-min-snapped time
                const ts = lastRefresh ? new Date(lastRefresh) : null;
                if (ts && !isNaN(ts.getTime())) {
                  return `Updated ${ts.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                }
                if (loading) return 'Loading...';
                // Fallback: snap current time to 5-minute boundary
                const now = Date.now();
                const snapped = new Date(Math.floor(now / (5 * 60 * 1000)) * (5 * 60 * 1000));
                return `Updated ${snapped.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}`;
              })()}
            </span>
          </div>

          {/* ── Tab toggle ──────────────────────────────────── */}
          <div className="flex items-center gap-2 mb-3">
            {TAB_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setActiveTab(opt.value); setSourceFilter('all'); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border text-center ${
                  opt.farsi ? 'font-farsi' : ''
                } ${
                  activeTab === opt.value
                    ? 'bg-saffron-600 text-white border-saffron-500 shadow-md shadow-saffron-600/20'
                    : 'bg-dark-900/60 text-dark-400 border-dark-800 hover:text-white hover:border-dark-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* ── Source filter pills (hidden for Telegram) ───── */}
          <div className={`flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide ${activeTab === 'telegram' ? 'hidden' : ''}`}>
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                sourceFilter === 'all'
                  ? 'bg-persian-600 text-white border-persian-500 shadow-md shadow-persian-600/20'
                  : 'bg-dark-900/60 text-dark-400 border-dark-800 hover:text-white hover:border-dark-600'
              }`}
            >
              All Sources
              {items.length > 0 && (
                <span className="ml-1.5 opacity-60">({items.length})</span>
              )}
            </button>
            {sources.map((source) => {
              const count = items.filter((i) => i.source === source).length;
              return (
                <button
                  key={source}
                  onClick={() => setSourceFilter(source)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                    hasFarsi(source) ? 'font-farsi' : ''
                  } ${
                    sourceFilter === source
                      ? 'bg-persian-600 text-white border-persian-500 shadow-md shadow-persian-600/20'
                      : 'bg-dark-900/60 text-dark-400 border-dark-800 hover:text-white hover:border-dark-600'
                  }`}
                >
                  {source}
                  <span className="ml-1.5 opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          /* Loading spinner */
          <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-dark-800" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-crimson-400 animate-spin" />
            </div>
            <p className="mt-4 text-sm text-dark-500">
              Fetching latest feeds...
            </p>
          </div>
        ) : error ? (
          /* Error state */
          <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-crimson-400"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">
              Unable to load news feeds
            </p>
            <p className="text-dark-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => loadFeeds()}
              className="px-4 py-2 rounded-lg bg-persian-600 hover:bg-persian-500 text-white text-sm font-medium transition-colors"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-center mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-dark-500"
              >
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">No articles found</p>
            <p className="text-dark-500 text-sm">
              {sourceFilter !== 'all'
                ? 'Try selecting a different source or check back later.'
                : 'No news feeds are available right now. Check back later.'}
            </p>
            {sourceFilter !== 'all' && (
              <button
                onClick={() => setSourceFilter('all')}
                className="mt-4 px-4 py-2 rounded-lg bg-dark-900 border border-dark-800 hover:border-dark-600 text-dark-300 text-sm font-medium transition-colors"
              >
                Show all sources
              </button>
            )}
          </div>
        ) : activeTab === 'telegram' ? (
          /* Telegram timeline */
          <div className="max-w-2xl mx-auto space-y-0 animate-fade-in">
            {filtered.map((item, idx) => (
              <a
                key={`${item.link}-${idx}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3 py-3 border-b border-dark-800/40 hover:bg-dark-900/40 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 pt-1">
                  <RelevanceIndicator relevance={item.relevance} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] text-dark-100 leading-snug group-hover:text-persian-300 transition-colors ${
                    hasFarsi(item.title) ? 'font-farsi' : ''
                  }`} dir={hasFarsi(item.title) ? 'rtl' : undefined}>
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-2xs font-semibold text-saffron-400/70">{item.source}</span>
                    <span className="text-2xs text-dark-600">{formatDate(item.pubDate)}</span>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1 text-dark-700 group-hover:text-persian-400 transition-colors">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ))}
          </div>
        ) : (
          /* Article grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {filtered.map((item, idx) => (
              <article
                key={`${item.link}-${idx}`}
                onClick={() => setSelectedItem(item)}
                className="group relative bg-dark-900/50 border border-dark-800/60 rounded-xl p-5 cursor-pointer
                  hover:border-persian-700/40 hover:bg-dark-900/80 hover:shadow-glass
                  transition-all duration-300 ease-out"
              >
                {/* Top row: source badge + date */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <RelevanceIndicator relevance={item.relevance} />
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-2xs font-bold uppercase tracking-wider bg-saffron-500/15 text-saffron-400 border border-saffron-500/20 ${
                      hasFarsi(item.source) ? 'font-farsi normal-case' : ''
                    }`}>
                      {item.source}
                    </span>
                    <BiasIndicator bias={item.bias} />
                    {item.paywall && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-dark-800 text-dark-500 border border-dark-700/50" title="May require subscription">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="mr-0.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                        Paywall
                      </span>
                    )}
                  </div>
                  <span className="text-2xs text-dark-500 font-medium">
                    {formatDate(item.pubDate)}
                  </span>
                </div>

                {/* Title */}
                <h2 className={`text-[15px] font-semibold text-white leading-snug mb-2 group-hover:text-persian-300 transition-colors duration-200 line-clamp-2 ${
                  hasFarsi(item.title) ? 'font-farsi' : ''
                }`} dir={hasFarsi(item.title) ? 'rtl' : undefined}>
                  {item.title}
                </h2>

                {/* AI Summary or Description */}
                {item.summary ? (
                  <div className={`text-sm leading-relaxed mb-4 p-3 rounded-lg bg-persian-500/5 border border-persian-500/10 ${
                    hasFarsi(item.summary) ? 'font-farsi' : ''
                  }`} dir={hasFarsi(item.summary) ? 'rtl' : undefined}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-persian-400"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                      <span className="text-2xs font-semibold text-persian-400 uppercase tracking-wider">AI Summary</span>
                    </div>
                    <p className="text-dark-300">{item.summary}</p>
                  </div>
                ) : (
                  <p className={`text-sm text-dark-400 leading-relaxed line-clamp-3 mb-4 ${
                    hasFarsi(item.description) ? 'font-farsi' : ''
                  }`} dir={hasFarsi(item.description) ? 'rtl' : undefined}>
                    {truncate(item.description, 180)}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-dark-800/40">
                  <span className="text-2xs text-dark-600 truncate max-w-[40%]">
                    {new URL(item.link).hostname.replace('www.', '')}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-crimson-400 group-hover:text-crimson-300 transition-colors">
                    Read more
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transform group-hover:translate-x-0.5 transition-transform duration-200"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>

                {/* Hover glow accent */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-persian-600/[0.03] to-crimson-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </article>
            ))}
          </div>
        )}
      </div>

      {/* ── Article Modal Overlay ───────────────────────────────── */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
          onClick={() => setSelectedItem(null)}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

          {/* Modal panel */}
          <div
            className="relative w-full max-w-2xl mx-4 my-8 sm:my-16 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-dark-900 border border-dark-800/80 rounded-2xl shadow-glass-lg overflow-hidden">
              {/* Modal header */}
              <div className="sticky top-0 z-10 bg-dark-900/95 backdrop-blur-md border-b border-dark-800/60 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RelevanceIndicator relevance={selectedItem.relevance} />
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-2xs font-bold uppercase tracking-wider bg-saffron-500/15 text-saffron-400 border border-saffron-500/20 ${
                    hasFarsi(selectedItem.source) ? 'font-farsi normal-case' : ''
                  }`}>
                    {selectedItem.source}
                  </span>
                  <BiasIndicator bias={selectedItem.bias} />
                  {selectedItem.paywall && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-dark-800 text-dark-500 border border-dark-700/50">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="mr-0.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                      Paywall
                    </span>
                  )}
                  <span className="text-xs text-dark-500">
                    {formatDate(selectedItem.pubDate)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-6">
                <h2 className={`text-xl sm:text-2xl font-bold text-white leading-tight mb-4 ${
                  hasFarsi(selectedItem.title) ? 'font-farsi' : ''
                }`} dir={hasFarsi(selectedItem.title) ? 'rtl' : undefined}>
                  {selectedItem.title}
                </h2>

                {/* AI Summary */}
                {selectedItem.summary && (
                  <div className={`mb-4 p-4 rounded-xl bg-persian-500/5 border border-persian-500/10 ${
                    hasFarsi(selectedItem.summary) ? 'font-farsi' : ''
                  }`} dir={hasFarsi(selectedItem.summary) ? 'rtl' : undefined}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-persian-400"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                      <span className="text-xs font-semibold text-persian-400">AI Summary</span>
                    </div>
                    <p className="text-sm text-dark-200 leading-relaxed">{selectedItem.summary}</p>
                  </div>
                )}

                {/* Description */}
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className={`text-dark-300 leading-relaxed whitespace-pre-line ${
                    hasFarsi(selectedItem.description) ? 'font-farsi' : ''
                  }`} dir={hasFarsi(selectedItem.description) ? 'rtl' : undefined}>
                    {stripHtml(selectedItem.description)}
                  </p>
                </div>

                {/* Source link */}
                <div className="mt-8 pt-5 border-t border-dark-800/60">
                  <a
                    href={selectedItem.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                      bg-gradient-to-r from-crimson-500 to-crimson-600
                      hover:from-crimson-400 hover:to-crimson-500
                      text-white text-sm font-semibold
                      shadow-lg shadow-crimson-500/20
                      transition-all duration-200 hover:shadow-crimson-500/30"
                  >
                    Read full article
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                  <p className="mt-3 text-2xs text-dark-600">
                    Opens on{' '}
                    <span className="text-dark-400">
                      {new URL(selectedItem.link).hostname.replace('www.', '')}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
