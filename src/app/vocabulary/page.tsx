'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

interface KeyTerm {
  term: string;
  definition: string;
  section: string;
  sectionName: string;
  farsi?: string;
}

export default function VocabularyPage() {
  const [terms, setTerms] = useState<KeyTerm[]>([]);
  const [query, setQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [flashMode, setFlashMode] = useState(false);
  const [flashIdx, setFlashIdx] = useState(0);
  const [showDef, setShowDef] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadTerms() {
      try {
        const res = await fetch('/data/keyTerms.json');
        const data: KeyTerm[] = await res.json();
        setTerms(data);
      } catch {
        setTerms([]);
      }
      setLoaded(true);
    }
    loadTerms();
  }, []);

  const sections = useMemo(() => {
    const secs = new Set(terms.map(t => t.section));
    return Array.from(secs).sort();
  }, [terms]);

  const filtered = useMemo(() => {
    let result = terms;
    if (selectedSection !== 'all') {
      result = result.filter(t => t.section === selectedSection);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(t =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.farsi && t.farsi.includes(q))
      );
    }
    return result;
  }, [terms, selectedSection, query]);

  const flashCards = filtered;

  useEffect(() => {
    if (flashMode) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === ' ') {
          e.preventDefault();
          setShowDef(prev => !prev);
        } else if (e.key === 'ArrowRight') {
          setFlashIdx(prev => Math.min(prev + 1, flashCards.length - 1));
          setShowDef(false);
        } else if (e.key === 'ArrowLeft') {
          setFlashIdx(prev => Math.max(prev - 1, 0));
          setShowDef(false);
        } else if (e.key === 'Escape') {
          setFlashMode(false);
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [flashMode, flashCards.length]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-shimmer w-48 h-6 rounded" />
      </div>
    );
  }

  if (flashMode && flashCards.length > 0) {
    const card = flashCards[flashIdx];
    return (
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setFlashMode(false)}
            className="text-sm text-dark-500 hover:text-persian-600 transition-colors"
          >
            Exit Flash Mode
          </button>
          <span className="text-sm text-dark-400">{flashIdx + 1}/{flashCards.length}</span>
        </div>
        <div
          className="glass-card rounded-xl p-8 min-h-[250px] flex flex-col items-center justify-center text-center cursor-pointer"
          onClick={() => setShowDef(prev => !prev)}
        >
          <h2 className="text-2xl font-bold mb-2">{card.term}</h2>
          {card.farsi && <p className="text-lg text-saffron-600 dark:text-saffron-400 font-farsi mb-4">{card.farsi}</p>}
          {showDef && (
            <p className="text-sm text-dark-600 dark:text-dark-300 mt-4 leading-relaxed animate-fade-in">
              {card.definition}
            </p>
          )}
          {!showDef && (
            <p className="text-2xs text-dark-400 mt-4">Click or press Space to reveal</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => { setFlashIdx(prev => Math.max(prev - 1, 0)); setShowDef(false); }}
            disabled={flashIdx === 0}
            className="px-4 py-2 rounded-lg text-sm bg-dark-100 dark:bg-dark-800 disabled:opacity-30 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => { setFlashIdx(prev => Math.min(prev + 1, flashCards.length - 1)); setShowDef(false); }}
            disabled={flashIdx === flashCards.length - 1}
            className="px-4 py-2 rounded-lg text-sm bg-dark-100 dark:bg-dark-800 disabled:opacity-30 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vocabulary</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400 mt-1">{terms.length} key terms across 30 sections</p>
        </div>
        <button
          onClick={() => { setFlashMode(true); setFlashIdx(0); setShowDef(false); }}
          disabled={filtered.length === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors disabled:opacity-50"
        >
          Flash Card Mode
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search terms..."
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-dark-100 dark:bg-dark-800 outline-none focus:ring-2 focus:ring-persian-500/50 placeholder:text-dark-400"
          />
        </div>
        <select
          value={selectedSection}
          onChange={e => setSelectedSection(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm bg-dark-100 dark:bg-dark-800 outline-none"
        >
          <option value="all">All Sections</option>
          {sections.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Terms List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-dark-400">
          {terms.length === 0 ? 'No vocabulary data available yet.' : 'No terms match your search.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((term, i) => (
            <div
              key={`${term.section}-${term.term}-${i}`}
              className="glass-card rounded-lg p-4 glass-card-hover"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{term.term}</h3>
                    {term.farsi && (
                      <span className="text-sm text-saffron-600 dark:text-saffron-400 font-farsi">{term.farsi}</span>
                    )}
                  </div>
                  <p className="text-sm text-dark-600 dark:text-dark-300 mt-1 leading-relaxed">{term.definition}</p>
                </div>
                <span className="text-2xs text-dark-400 shrink-0">{term.section}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
