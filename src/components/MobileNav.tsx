'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Section, ACT_MAP } from '@/lib/types';
import { useProgress, useTheme } from './Providers';
import SearchModal from './SearchModal';

const ACT_COLORS: Record<number, string> = {
  1: 'bg-turquoise-500',
  2: 'bg-persian-500',
  3: 'bg-saffron-500',
  4: 'bg-amber-500',
};

interface Props {
  sections: Section[];
}

export default function MobileNav({ sections }: Props) {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();
  const { isCompleted, completedCount, streak } = useProgress();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedActs, setExpandedActs] = useState<Record<number, boolean>>({ 1: true });

  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0);
  const progressPct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  // Close drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const toggleAct = (actNum: number) => {
    setExpandedActs(prev => ({ ...prev, [actNum]: !prev[actNum] }));
  };

  // Group sections by act
  const actGroups: Record<number, Section[]> = {};
  for (const sec of sections) {
    if (!actGroups[sec.actNum]) actGroups[sec.actNum] = [];
    actGroups[sec.actNum].push(sec);
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-dark-900/95 backdrop-blur-lg border-t border-dark-800">
        <div className="flex items-center justify-around h-14">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              pathname === '/' ? 'text-persian-400' : 'text-dark-400'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            </svg>
            <span className="text-2xs mt-0.5">Home</span>
          </Link>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-dark-400"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <span className="text-2xs mt-0.5">Search</span>
          </button>

          <Link
            href="/review"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              pathname === '/review' ? 'text-persian-400' : 'text-dark-400'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
            <span className="text-2xs mt-0.5">Review</span>
          </Link>

          <Link
            href="/quiz"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              pathname === '/quiz' ? 'text-persian-400' : 'text-dark-400'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <span className="text-2xs mt-0.5">Quiz</span>
          </Link>

          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-dark-400"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <span className="text-2xs mt-0.5">Menu</span>
          </button>
        </div>
      </nav>

      {/* Slide-out Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-dark-900 shadow-2xl overflow-hidden flex flex-col animate-slideInLeft">
            {/* Header */}
            <div className="p-4 border-b border-dark-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-persian-600 to-turquoise-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">IR</span>
                  </div>
                  <span className="font-semibold text-sm">Rebuilding Iran</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-dark-800 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 text-2xs text-dark-400 mb-2">
                <span>{completedCount}/{totalLectures} lectures</span>
                <span className="ml-auto">{streak > 0 ? `${streak}d streak` : ''}</span>
              </div>
              <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-persian-500 to-turquoise-500 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={toggle}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-dark-800 hover:bg-dark-700 transition-colors"
                >
                  {dark ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  )}
                  {dark ? 'Light' : 'Dark'}
                </button>
                <Link
                  href="/practice"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-dark-800 hover:bg-dark-700 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Practice
                </Link>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-2 px-2">
              {Object.entries(ACT_MAP).map(([aNum, aInfo]) => {
                const actNum = parseInt(aNum);
                const actSections = actGroups[actNum] || [];
                const isExpanded = expandedActs[actNum];
                const completedInAct = actSections.reduce(
                  (sum, s) => sum + s.lectures.filter(l => isCompleted(l.slug)).length, 0
                );
                const totalInAct = actSections.reduce((sum, s) => sum + s.lectures.length, 0);

                return (
                  <div key={actNum} className="mb-1">
                    <button
                      onClick={() => toggleAct(actNum)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-dark-800 transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full ${ACT_COLORS[actNum]}`} />
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      >
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                      <span className="flex-1 text-left truncate">{aInfo.label}</span>
                      <span className="text-2xs text-dark-400">{completedInAct}/{totalInAct}</span>
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-0.5">
                        {actSections.map(sec => (
                          <Link
                            key={sec.num}
                            href={`/lecture/${sec.lectures[0]?.slug}`}
                            onClick={() => setDrawerOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-dark-800 transition-colors"
                          >
                            <span className="text-dark-500">{sec.num}.</span>
                            <span className="flex-1 truncate">{sec.name}</span>
                            <span className="text-2xs text-dark-500">
                              {sec.lectures.filter(l => isCompleted(l.slug)).length}/{sec.lectures.length}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-dark-800">
              <Link
                href="/vocabulary"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-dark-800 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
                Vocabulary
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
