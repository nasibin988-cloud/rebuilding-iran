'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import lunr from 'lunr';
import { useTheme, useProgress } from './Providers';

interface SearchDoc {
  slug: string;
  tier: string;
  title: string;
  sectionNum: string;
  sectionName: string;
  act: string;
  actNum: number;
  excerpt: string;
}

interface SearchResult {
  ref: string;
  score: number;
  doc: SearchDoc;
}

interface Command {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'navigation' | 'action' | 'tool';
  action: () => void;
  keywords?: string[];
}

const ACT_COLORS: Record<number, string> = {
  1: 'bg-turquoise-500/20 text-turquoise-400',
  2: 'bg-persian-500/20 text-persian-400',
  3: 'bg-saffron-500/20 text-saffron-400',
  4: 'bg-amber-500/20 text-amber-400',
};

const TIER_LABELS: Record<string, string> = {
  standard: 'Standard',
  extended: 'Extended',
  scholarly: 'Scholarly',
};

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navigation',
  action: 'Actions',
  tool: 'Tools',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const { dark, toggle: toggleTheme } = useTheme();
  const { state, exportData } = useProgress();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchIndex, setSearchIndex] = useState<lunr.Index | null>(null);
  const [searchDocs, setSearchDocs] = useState<Record<string, SearchDoc>>({});
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [mode, setMode] = useState<'search' | 'commands'>('search');

  // Define commands
  const commands: Command[] = [
    // Navigation
    { id: 'home', name: 'Go to Home', description: 'Return to the home page', icon: '🏠', category: 'navigation', action: () => router.push('/'), keywords: ['home', 'main', 'start'] },
    { id: 'progress', name: 'View Progress', description: 'See your learning progress and achievements', icon: '📊', category: 'navigation', action: () => router.push('/progress'), keywords: ['progress', 'stats', 'dashboard', 'achievements'] },
    { id: 'quiz', name: 'Take a Quiz', description: 'Test your knowledge with a quiz', icon: '✏️', category: 'navigation', action: () => router.push('/quiz'), keywords: ['quiz', 'test', 'exam'] },
    { id: 'review', name: 'Review Flashcards', description: 'Practice with spaced repetition flashcards', icon: '🃏', category: 'navigation', action: () => router.push('/review'), keywords: ['review', 'flashcard', 'srs', 'cards'] },
    { id: 'practice', name: 'Practice Mode', description: 'Practice with AI-graded questions', icon: '📝', category: 'navigation', action: () => router.push('/practice'), keywords: ['practice', 'ai', 'grading'] },
    { id: 'debate', name: 'Debate Simulator', description: 'Practice defending positions with AI', icon: '💬', category: 'navigation', action: () => router.push('/debate'), keywords: ['debate', 'argue', 'discuss', 'ai'] },
    { id: 'timeline', name: 'View Timeline', description: 'Explore Iranian history on a timeline', icon: '📅', category: 'navigation', action: () => router.push('/timeline'), keywords: ['timeline', 'history', 'dates'] },
    { id: 'concept-map', name: 'Concept Map', description: 'Visualize curriculum connections', icon: '🗺️', category: 'navigation', action: () => router.push('/concept-map'), keywords: ['concept', 'map', 'visual', 'graph'] },
    { id: 'bookmarks', name: 'Bookmarks & Highlights', description: 'View your saved bookmarks and highlights', icon: '🔖', category: 'navigation', action: () => router.push('/bookmarks'), keywords: ['bookmark', 'highlight', 'saved'] },

    // Actions
    { id: 'toggle-theme', name: dark ? 'Switch to Light Mode' : 'Switch to Dark Mode', description: 'Toggle between light and dark theme', icon: dark ? '☀️' : '🌙', category: 'action', action: () => toggleTheme(), keywords: ['theme', 'dark', 'light', 'mode'] },
    { id: 'export-progress', name: 'Export Progress', description: 'Download your progress data as JSON', icon: '📤', category: 'action', action: () => {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rebuilding-iran-progress-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }, keywords: ['export', 'download', 'backup', 'save'] },
    { id: 'continue-reading', name: 'Continue Reading', description: state.lastRead ? `Resume from ${state.lastRead}` : 'No reading history', icon: '📖', category: 'action', action: () => state.lastRead && router.push(`/lecture/${state.lastRead}`), keywords: ['continue', 'resume', 'last', 'reading'] },
    { id: 'random-lecture', name: 'Random Lecture', description: 'Jump to a random lecture', icon: '🎲', category: 'action', action: () => {
      const slugs = Object.keys(searchDocs).filter(k => k.includes('standard'));
      if (slugs.length > 0) {
        const randomSlug = slugs[Math.floor(Math.random() * slugs.length)];
        const doc = searchDocs[randomSlug];
        if (doc) router.push(`/lecture/${doc.slug}`);
      }
    }, keywords: ['random', 'surprise', 'any'] },

    // Tools
    { id: 'print', name: 'Print Current Page', description: 'Open print dialog for current page', icon: '🖨️', category: 'tool', action: () => window.print(), keywords: ['print', 'pdf', 'paper'] },
  ];

  // Filter commands based on query
  const filteredCommands = query.startsWith('>')
    ? commands.filter(cmd => {
        const searchQuery = query.slice(1).toLowerCase().trim();
        if (!searchQuery) return true;
        return cmd.name.toLowerCase().includes(searchQuery) ||
               cmd.description.toLowerCase().includes(searchQuery) ||
               cmd.keywords?.some(k => k.includes(searchQuery));
      })
    : [];

  // Load search index on mount
  useEffect(() => {
    async function loadIndex() {
      try {
        const [indexRes, docsRes] = await Promise.all([
          fetch('/data/search-index.json'),
          fetch('/data/search-docs.json'),
        ]);

        if (!indexRes.ok || !docsRes.ok) {
          console.error('Failed to load search index');
          setLoading(false);
          return;
        }

        const indexData = await indexRes.json();
        const docsData = await docsRes.json();

        const idx = lunr.Index.load(indexData);
        setSearchIndex(idx);
        setSearchDocs(docsData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading search index:', err);
        setLoading(false);
      }
    }

    loadIndex();
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search
  useEffect(() => {
    if (!searchIndex || !query.trim()) {
      setResults([]);
      return;
    }

    try {
      // Support wildcards for partial matching
      const searchQuery = query
        .split(/\s+/)
        .filter(Boolean)
        .map(term => `${term}*`)
        .join(' ');

      const rawResults = searchIndex.search(searchQuery);

      let mappedResults: SearchResult[] = rawResults
        .map(r => ({
          ref: r.ref,
          score: r.score,
          doc: searchDocs[r.ref],
        }))
        .filter(r => r.doc);

      // Apply tier filter
      if (tierFilter !== 'all') {
        mappedResults = mappedResults.filter(r => r.doc.tier === tierFilter);
      }

      // Dedupe by slug (keep highest scoring tier version)
      const seenSlugs = new Map<string, SearchResult>();
      for (const result of mappedResults) {
        const existing = seenSlugs.get(result.doc.slug);
        if (!existing || result.score > existing.score) {
          seenSlugs.set(result.doc.slug, result);
        }
      }

      setResults(Array.from(seenSlugs.values()).slice(0, 20));
      setSelectedIndex(0);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    }
  }, [query, searchIndex, searchDocs, tierFilter]);

  // Determine current mode based on query
  const isCommandMode = query.startsWith('>');
  const currentItems = isCommandMode ? filteredCommands : results;
  const totalItems = currentItems.length;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const maxIndex = isCommandMode ? filteredCommands.length - 1 : results.length - 1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, maxIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isCommandMode && filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex]);
      } else if (results[selectedIndex]) {
        navigateToResult(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Toggle between search and command mode
      if (query === '') {
        setQuery('>');
      } else if (query === '>') {
        setQuery('');
      }
    }
  }, [results, selectedIndex, onClose, isCommandMode, filteredCommands]);

  const navigateToResult = (result: SearchResult) => {
    router.push(`/lecture/${result.doc.slug}`);
    onClose();
    setQuery('');
  };

  const executeCommand = (command: Command) => {
    command.action();
    onClose();
    setQuery('');
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Global keyboard shortcut
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl bg-dark-900 border border-dark-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-700">
          {isCommandMode ? (
            <span className="text-persian-400 text-lg shrink-0">&gt;</span>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-dark-400 shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isCommandMode ? "Type a command..." : "Search lectures or type > for commands..."}
            className="flex-1 bg-transparent text-white placeholder-dark-500 outline-none text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-dark-700 rounded"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-2xs text-dark-400 bg-dark-800 rounded">
            {isCommandMode ? 'TAB: Search' : 'TAB: Commands'}
          </kbd>
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-2xs text-dark-400 bg-dark-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Tier Filter - only show in search mode */}
        {!isCommandMode && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-dark-800">
            <span className="text-2xs text-dark-500">Tier:</span>
            {['all', 'standard', 'extended', 'scholarly'].map(tier => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-2 py-0.5 text-2xs rounded transition-colors ${
                  tierFilter === tier
                    ? 'bg-persian-600 text-white'
                    : 'text-dark-400 hover:bg-dark-800'
                }`}
              >
                {tier === 'all' ? 'All' : TIER_LABELS[tier]}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {isCommandMode ? (
            // Command palette mode
            filteredCommands.length > 0 ? (
              <ul>
                {/* Group commands by category */}
                {(['navigation', 'action', 'tool'] as const).map(category => {
                  const categoryCommands = filteredCommands.filter(c => c.category === category);
                  if (categoryCommands.length === 0) return null;

                  return (
                    <li key={category}>
                      <div className="px-4 py-1.5 text-2xs text-dark-500 font-medium uppercase tracking-wider bg-dark-800/50">
                        {CATEGORY_LABELS[category]}
                      </div>
                      <ul>
                        {categoryCommands.map(cmd => {
                          const idx = filteredCommands.indexOf(cmd);
                          return (
                            <li key={cmd.id}>
                              <button
                                onClick={() => executeCommand(cmd)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                                  idx === selectedIndex ? 'bg-dark-800' : 'hover:bg-dark-800/50'
                                }`}
                              >
                                <span className="text-xl shrink-0">{cmd.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-white">{cmd.name}</div>
                                  <div className="text-2xs text-dark-400">{cmd.description}</div>
                                </div>
                                {idx === selectedIndex && (
                                  <kbd className="hidden sm:block text-2xs text-dark-500 bg-dark-700 px-1.5 py-0.5 rounded shrink-0">
                                    Enter
                                  </kbd>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-12 text-center text-dark-500">
                <p>No commands found</p>
                <p className="text-2xs mt-2">Try a different search term</p>
              </div>
            )
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-persian-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : query && results.length === 0 ? (
            <div className="py-12 text-center text-dark-500">
              No results found for "{query}"
            </div>
          ) : query ? (
            <ul>
              {results.map((result, idx) => (
                <li key={result.ref}>
                  <button
                    onClick={() => navigateToResult(result)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                      idx === selectedIndex ? 'bg-dark-800' : 'hover:bg-dark-800/50'
                    }`}
                  >
                    <div className="shrink-0 mt-1">
                      <span className={`inline-block px-1.5 py-0.5 text-2xs rounded ${ACT_COLORS[result.doc.actNum]}`}>
                        {result.doc.act}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">
                          {result.doc.title}
                        </span>
                        <span className="text-2xs text-dark-500 shrink-0">
                          {result.doc.slug}
                        </span>
                      </div>
                      <div className="text-2xs text-dark-400 mt-0.5">
                        {result.doc.sectionNum}. {result.doc.sectionName}
                      </div>
                      <p className="text-xs text-dark-500 mt-1 line-clamp-2">
                        {result.doc.excerpt}
                      </p>
                    </div>
                    {idx === selectedIndex && (
                      <kbd className="hidden sm:block text-2xs text-dark-500 bg-dark-700 px-1.5 py-0.5 rounded shrink-0">
                        Enter
                      </kbd>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-12 text-center text-dark-500">
              <p>Type to search across all lectures</p>
              <p className="text-2xs mt-2">Or type <kbd className="px-1.5 py-0.5 bg-dark-800 rounded mx-1">&gt;</kbd> for commands</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-dark-800 text-2xs text-dark-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-dark-800 rounded">↑</kbd>
              <kbd className="px-1 py-0.5 bg-dark-800 rounded">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-dark-800 rounded">Enter</kbd>
              {isCommandMode ? 'run' : 'select'}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-dark-800 rounded">Tab</kbd>
              {isCommandMode ? 'search' : 'commands'}
            </span>
          </div>
          <span>
            {isCommandMode ? `${filteredCommands.length} commands` : `${results.length} results`}
          </span>
        </div>
      </div>
    </div>
  );
}
