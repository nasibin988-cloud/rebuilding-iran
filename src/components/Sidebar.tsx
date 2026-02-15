'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Section, ACT_MAP } from '@/lib/types';
import { useTheme } from './Providers';
import { useProgress } from './Providers';
import SearchModal from './SearchModal';
import UserMenu from './UserMenu';

const ACT_COLORS: Record<number, string> = {
  1: 'border-turquoise-500',
  2: 'border-persian-500',
  3: 'border-saffron-500',
  4: 'border-amber-500',
};

const ACT_DOT_COLORS: Record<number, string> = {
  1: 'bg-turquoise-500',
  2: 'bg-persian-500',
  3: 'bg-saffron-500',
  4: 'bg-amber-500',
};

interface Props {
  sections: Section[];
}

export default function Sidebar({ sections }: Props) {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();
  const { isCompleted, completedCount, streak } = useProgress();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedActs, setExpandedActs] = useState<Record<number, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);

  // Global keyboard shortcut for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0);
  const progressPct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  const actGroups = useMemo(() => {
    const groups: Record<number, Section[]> = {};
    for (const sec of sections) {
      if (!groups[sec.actNum]) groups[sec.actNum] = [];
      groups[sec.actNum].push(sec);
    }
    return groups;
  }, [sections]);

  const toggleAct = (actNum: number) => {
    setExpandedActs(prev => ({ ...prev, [actNum]: !prev[actNum] }));
  };

  const toggleSection = (num: string) => {
    setExpandedSections(prev => ({ ...prev, [num]: !prev[num] }));
  };

  if (collapsed) {
    return (
      <div className="sidebar w-14 flex flex-col items-center py-4 gap-3 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-dark-200 dark:hover:bg-dark-800 transition-colors"
          title="Expand sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-persian-600 flex items-center justify-center text-white text-2xs font-bold">
          {progressPct}%
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar w-72 flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-200 dark:border-dark-800">
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-persian-600 to-turquoise-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">IR</span>
            </div>
            <span className="font-semibold text-sm group-hover:text-persian-600 dark:group-hover:text-persian-400 transition-colors">
              Rebuilding Iran
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <UserMenu />
            <button
              onClick={() => setCollapsed(true)}
              className="w-7 h-7 rounded flex items-center justify-center hover:bg-dark-200 dark:hover:bg-dark-800 transition-colors text-dark-400"
              title="Collapse sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 text-2xs text-dark-500 dark:text-dark-400 mb-2">
          <span>{completedCount}/{totalLectures} lectures</span>
          <span className="ml-auto">{streak > 0 ? `${streak}d streak` : ''}</span>
        </div>
        <div className="h-1.5 bg-dark-200 dark:bg-dark-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-persian-500 to-turquoise-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={toggle}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            {dark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
            {dark ? 'Light' : 'Dark'}
          </button>
          <Link
            href="/review"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            Review
          </Link>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Link
            href="/quiz"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            Quiz
          </Link>
          <Link
            href="/practice"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Practice
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Link
            href="/progress"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
            Progress
          </Link>
          <Link
            href="/timeline"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Timeline
          </Link>
          <Link
            href="/concept-map"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/>
              <path d="M12 8v4M8.5 14.5l-2 2.5M15.5 14.5l2 2.5"/>
            </svg>
            Concept Map
          </Link>
          <Link
            href="/bookmarks"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
            </svg>
            Bookmarks
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Link
            href="/debate"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-gradient-to-r from-persian-600 to-saffron-600 text-white hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/>
            </svg>
            Debate
          </Link>
          <Link
            href="/scenarios"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-gradient-to-r from-turquoise-600 to-emerald-600 text-white hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
            Scenarios
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Link
            href="/news"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-2M19 20l-7-5-7 5"/>
              <path d="M3 8h10M3 12h6"/>
            </svg>
            News
          </Link>
          <Link
            href="/groups"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-2xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            Groups
          </Link>
        </div>

        {/* Search Button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-2xs bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors text-dark-500 dark:text-dark-400"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <span className="flex-1 text-left">Search lectures...</span>
          <kbd className="px-1.5 py-0.5 bg-dark-200 dark:bg-dark-700 rounded text-2xs">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {Object.entries(ACT_MAP).map(([aNum, aInfo]) => {
          const actNum = parseInt(aNum);
          const actSections = actGroups[actNum] || [];
          const isExpanded = expandedActs[actNum] ?? (actNum <= 2);
          const completedInAct = actSections.reduce(
            (sum, s) => sum + s.lectures.filter(l => isCompleted(l.slug)).length, 0
          );
          const totalInAct = actSections.reduce((sum, s) => sum + s.lectures.length, 0);

          return (
            <div key={actNum} className="mb-1">
              <button
                onClick={() => toggleAct(actNum)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-semibold hover:bg-dark-100 dark:hover:bg-dark-800/60 transition-colors border-l-3 ${ACT_COLORS[actNum] || 'border-dark-300'}`}
                style={{ borderLeftWidth: '3px' }}
              >
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className={`transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                >
                  <path d="M9 18l6-6-6-6"/>
                </svg>
                <span className="truncate flex-1 text-left">{aInfo.label}: {aInfo.name}</span>
                <span className="text-2xs text-dark-400 shrink-0">{completedInAct}/{totalInAct}</span>
              </button>

              {isExpanded && (
                <div className="ml-3 mt-0.5">
                  {actSections.map(sec => {
                    const isSectionExpanded = expandedSections[sec.num] ?? false;
                    const completedInSec = sec.lectures.filter(l => isCompleted(l.slug)).length;

                    return (
                      <div key={sec.num} className="mb-0.5">
                        <button
                          onClick={() => toggleSection(sec.num)}
                          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-2xs hover:bg-dark-100 dark:hover:bg-dark-800/40 transition-colors"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ACT_DOT_COLORS[actNum]}`} />
                          <svg
                            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                            className={`transition-transform duration-200 shrink-0 ${isSectionExpanded ? 'rotate-90' : ''}`}
                          >
                            <path d="M9 18l6-6-6-6"/>
                          </svg>
                          <span className="truncate flex-1 text-left font-medium">{sec.num}. {sec.name}</span>
                          <span className="text-dark-400 shrink-0">{completedInSec}/{sec.lectures.length}</span>
                        </button>

                        {isSectionExpanded && (
                          <div className="ml-5 mt-0.5 space-y-0.5">
                            {sec.lectures.map(lec => {
                              const isActive = pathname === `/lecture/${lec.slug}`;
                              const done = isCompleted(lec.slug);
                              return (
                                <Link
                                  key={lec.slug}
                                  href={`/lecture/${lec.slug}`}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-2xs transition-colors ${
                                    isActive
                                      ? 'bg-persian-100 dark:bg-persian-900/30 text-persian-700 dark:text-persian-300 font-medium'
                                      : 'hover:bg-dark-100 dark:hover:bg-dark-800/40 text-dark-600 dark:text-dark-400'
                                  }`}
                                >
                                  {done ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-turquoise-500 shrink-0">
                                      <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                  ) : (
                                    <span className="w-3 h-3 rounded-full border border-dark-300 dark:border-dark-600 shrink-0" />
                                  )}
                                  <span className="truncate">{lec.title}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
