'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LectureMeta } from '@/lib/types';

interface Props {
  lectures: LectureMeta[];
}

export default function CommandPalette({ lectures }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return lectures.slice(0, 20);
    const q = query.toLowerCase();
    return lectures.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.sectionName.toLowerCase().includes(q) ||
      l.slug.includes(q) ||
      l.sectionId.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [query, lectures]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const navigate = (slug: string) => {
    setOpen(false);
    router.push(`/lecture/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      navigate(results[selectedIdx].slug);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg glass-card rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-200 dark:border-dark-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dark-400 shrink-0">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search lectures..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-dark-400"
          />
          <kbd className="text-2xs px-1.5 py-0.5 rounded border border-dark-300 dark:border-dark-600 text-dark-400">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-dark-400">No results found</div>
          ) : (
            results.map((lec, i) => (
              <button
                key={lec.slug}
                onClick={() => navigate(lec.slug)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  i === selectedIdx
                    ? 'bg-persian-100 dark:bg-persian-900/30 text-persian-700 dark:text-persian-300'
                    : 'hover:bg-dark-100 dark:hover:bg-dark-800/60'
                }`}
              >
                <span className="text-2xs font-mono text-dark-400 shrink-0 w-12">{lec.slug}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{lec.title}</div>
                  <div className="text-2xs text-dark-400 truncate">{lec.sectionName}</div>
                </div>
                <span className="text-2xs text-dark-400 shrink-0">{lec.readingTime}m</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
