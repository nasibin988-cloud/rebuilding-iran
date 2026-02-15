'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { ProgressState, Language } from '@/lib/types';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';

// ─── Highlight Types ─────────────────────────────────────────────
export interface Highlight {
  id: string;
  slug: string;
  text: string;
  note?: string;
  color: 'yellow' | 'green' | 'blue' | 'pink';
  createdAt: number;
}

export interface Bookmark {
  slug: string;
  title: string;
  createdAt: number;
}

// ─── Theme Context ────────────────────────────────────────────────
interface ThemeContextType {
  dark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ dark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

// ─── Language Context ─────────────────────────────────────────────
interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType>({ lang: 'en', setLang: () => {}, isRtl: false });
export const useLanguage = () => useContext(LanguageContext);

// ─── Progress Context ─────────────────────────────────────────────
interface ProgressContextType {
  state: ProgressState;
  completed: Record<string, number>;
  dailyLog: Record<string, number>;
  isCompleted: (slug: string) => boolean;
  toggleCompleted: (slug: string) => void;
  getNote: (slug: string) => string;
  setNote: (slug: string, text: string) => void;
  setLastRead: (slug: string) => void;
  completedCount: number;
  streak: number;
  exportData: () => string;
  importData: (data: string) => boolean;
  isSyncing: boolean;
}

const defaultProgress: ProgressState = {
  completed: {},
  notes: {},
  lastRead: null,
  dailyLog: {},
};

const ProgressContext = createContext<ProgressContextType>({
  state: defaultProgress,
  completed: {},
  dailyLog: {},
  isCompleted: () => false,
  toggleCompleted: () => {},
  getNote: () => '',
  setNote: () => {},
  setLastRead: () => {},
  completedCount: 0,
  streak: 0,
  exportData: () => '',
  importData: () => false,
  isSyncing: false,
});

export const useProgress = () => useContext(ProgressContext);

// ─── Highlights Context ──────────────────────────────────────────
interface HighlightsContextType {
  highlights: Highlight[];
  bookmarks: Bookmark[];
  addHighlight: (slug: string, text: string, color?: Highlight['color']) => string;
  removeHighlight: (id: string) => void;
  updateHighlightNote: (id: string, note: string) => void;
  getHighlightsForLecture: (slug: string) => Highlight[];
  addBookmark: (slug: string, title: string) => void;
  removeBookmark: (slug: string) => void;
  isBookmarked: (slug: string) => boolean;
}

const HighlightsContext = createContext<HighlightsContextType>({
  highlights: [],
  bookmarks: [],
  addHighlight: () => '',
  removeHighlight: () => {},
  updateHighlightNote: () => {},
  getHighlightsForLecture: () => [],
  addBookmark: () => {},
  removeBookmark: () => {},
  isBookmarked: () => false,
});

export const useHighlights = () => useContext(HighlightsContext);

// ─── Helpers ──────────────────────────────────────────────────────
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcStreak(dailyLog: Record<string, number>): number {
  let streak = 0;
  const d = new Date();
  const todayStr = d.toISOString().slice(0, 10);
  if (!dailyLog[todayStr]) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (dailyLog[key] && dailyLog[key] > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

const LS_DARK = 'iran-dark';
const LS_PROGRESS = 'iran-progress';
const LS_LANG = 'iran-lang';
const LS_HIGHLIGHTS = 'iran-highlights';
const LS_BOOKMARKS = 'iran-bookmarks';

// ─── Combined Provider ────────────────────────────────────────────
export default function Providers({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = createClient();

  const [dark, setDark] = useState(true);
  const [lang, setLangState] = useState<Language>('en');
  const [progress, setProgress] = useState<ProgressState>(defaultProgress);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedRef = useRef<string>('');

  // Load local data on mount
  useEffect(() => {
    setMounted(true);
    const savedDark = localStorage.getItem(LS_DARK);
    if (savedDark === '0') {
      setDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDark(true);
      document.documentElement.classList.add('dark');
    }
    const savedLang = localStorage.getItem(LS_LANG) as Language | null;
    if (savedLang === 'fa' || savedLang === 'en') {
      setLangState(savedLang);
    }
    const savedProgress = localStorage.getItem(LS_PROGRESS);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        const { completed, notes, lastRead, dailyLog } = parsed;
        setProgress({ completed: completed || {}, notes: notes || {}, lastRead: lastRead || null, dailyLog: dailyLog || {} });
      } catch {}
    }

    const savedHighlights = localStorage.getItem(LS_HIGHLIGHTS);
    if (savedHighlights) {
      try {
        setHighlights(JSON.parse(savedHighlights));
      } catch {}
    }

    const savedBookmarks = localStorage.getItem(LS_BOOKMARKS);
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch {}
    }
  }, []);

  // Fetch from cloud when user logs in
  useEffect(() => {
    if (!user || !mounted) return;

    const fetchCloudData = async () => {
      setIsSyncing(true);
      try {
        // Fetch progress
        const { data: progressData } = await supabase
          .from('progress')
          .select('lecture_slug, completed_at')
          .eq('user_id', user.id);

        // Fetch notes
        const { data: notesData } = await supabase
          .from('notes')
          .select('lecture_slug, content')
          .eq('user_id', user.id);

        // Fetch highlights
        const { data: highlightsData } = await supabase
          .from('highlights')
          .select('id, lecture_slug, text, color, note, created_at')
          .eq('user_id', user.id);

        // Fetch bookmarks
        const { data: bookmarksData } = await supabase
          .from('bookmarks')
          .select('lecture_slug, created_at')
          .eq('user_id', user.id);

        // Merge cloud data with local (cloud wins for conflicts)
        if (progressData) {
          const cloudCompleted: Record<string, number> = {};
          const cloudDailyLog: Record<string, number> = {};

          for (const p of progressData) {
            const ts = new Date(p.completed_at).getTime();
            cloudCompleted[p.lecture_slug] = ts;
            const dateKey = p.completed_at.slice(0, 10);
            cloudDailyLog[dateKey] = (cloudDailyLog[dateKey] || 0) + 1;
          }

          setProgress(prev => {
            // Merge: use cloud data, but keep local items not in cloud
            const merged = {
              completed: { ...prev.completed, ...cloudCompleted },
              notes: { ...prev.notes },
              lastRead: prev.lastRead,
              dailyLog: { ...prev.dailyLog, ...cloudDailyLog },
            };

            if (notesData) {
              for (const n of notesData) {
                merged.notes[n.lecture_slug] = n.content;
              }
            }

            localStorage.setItem(LS_PROGRESS, JSON.stringify(merged));
            return merged;
          });
        }

        if (highlightsData && highlightsData.length > 0) {
          const cloudHighlights: Highlight[] = highlightsData.map(h => ({
            id: h.id,
            slug: h.lecture_slug,
            text: h.text,
            color: h.color as Highlight['color'],
            note: h.note || undefined,
            createdAt: new Date(h.created_at).getTime(),
          }));

          setHighlights(prev => {
            // Merge by ID
            const merged = [...prev];
            for (const ch of cloudHighlights) {
              if (!merged.some(h => h.id === ch.id)) {
                merged.push(ch);
              }
            }
            localStorage.setItem(LS_HIGHLIGHTS, JSON.stringify(merged));
            return merged;
          });
        }

        if (bookmarksData && bookmarksData.length > 0) {
          const cloudBookmarks: Bookmark[] = bookmarksData.map(b => ({
            slug: b.lecture_slug,
            title: '', // We don't store title in DB
            createdAt: new Date(b.created_at).getTime(),
          }));

          setBookmarks(prev => {
            const merged = [...prev];
            for (const cb of cloudBookmarks) {
              if (!merged.some(b => b.slug === cb.slug)) {
                merged.push(cb);
              }
            }
            localStorage.setItem(LS_BOOKMARKS, JSON.stringify(merged));
            return merged;
          });
        }
      } catch (error) {
        console.error('Failed to fetch cloud data:', error);
      }
      setIsSyncing(false);
    };

    fetchCloudData();
  }, [user, mounted]);

  // Debounced sync to cloud
  const syncToCloud = useCallback(async () => {
    if (!user) return;

    const dataHash = JSON.stringify({ progress, highlights, bookmarks });
    if (dataHash === lastSyncedRef.current) return;

    setIsSyncing(true);
    try {
      // Sync completed lectures
      const completedEntries = Object.entries(progress.completed);
      if (completedEntries.length > 0) {
        const progressRecords = completedEntries.map(([slug, timestamp]) => ({
          user_id: user.id,
          lecture_slug: slug,
          completed_at: new Date(timestamp).toISOString(),
          tier_viewed: 'standard',
          time_spent: 0,
        }));

        await supabase
          .from('progress')
          .upsert(progressRecords, { onConflict: 'user_id,lecture_slug' });
      }

      // Sync notes
      const noteEntries = Object.entries(progress.notes).filter(([, content]) => content);
      if (noteEntries.length > 0) {
        const noteRecords = noteEntries.map(([slug, content]) => ({
          user_id: user.id,
          lecture_slug: slug,
          content,
        }));

        await supabase
          .from('notes')
          .upsert(noteRecords, { onConflict: 'user_id,lecture_slug' });
      }

      // Sync highlights
      if (highlights.length > 0) {
        // Delete removed highlights
        await supabase
          .from('highlights')
          .delete()
          .eq('user_id', user.id)
          .not('id', 'in', `(${highlights.map(h => `'${h.id}'`).join(',')})`);

        // Upsert current highlights
        const highlightRecords = highlights.map(h => ({
          id: h.id,
          user_id: user.id,
          lecture_slug: h.slug,
          text: h.text,
          color: h.color,
          note: h.note || null,
          created_at: new Date(h.createdAt).toISOString(),
        }));

        await supabase.from('highlights').upsert(highlightRecords);
      }

      // Sync bookmarks
      if (bookmarks.length > 0) {
        const bookmarkRecords = bookmarks.map(b => ({
          user_id: user.id,
          lecture_slug: b.slug,
          created_at: new Date(b.createdAt).toISOString(),
        }));

        await supabase
          .from('bookmarks')
          .upsert(bookmarkRecords, { onConflict: 'user_id,lecture_slug' });
      }

      lastSyncedRef.current = dataHash;
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
    }
    setIsSyncing(false);
  }, [user, progress, highlights, bookmarks, supabase]);

  // Trigger sync when data changes (debounced)
  useEffect(() => {
    if (!user || !mounted) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncToCloud();
    }, 2000); // 2 second debounce

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [progress, highlights, bookmarks, user, mounted, syncToCloud]);

  const toggleTheme = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(LS_DARK, next ? '1' : '0');
      return next;
    });
  }, []);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem(LS_LANG, l);
  }, []);

  const isCompleted = useCallback((slug: string) => !!progress.completed[slug], [progress]);

  const toggleCompleted = useCallback((slug: string) => {
    setProgress(prev => {
      const next = { ...prev, completed: { ...prev.completed }, dailyLog: { ...prev.dailyLog } };
      const today = todayKey();
      if (next.completed[slug]) {
        delete next.completed[slug];
        next.dailyLog[today] = Math.max(0, (next.dailyLog[today] || 0) - 1);
      } else {
        next.completed[slug] = Date.now();
        next.dailyLog[today] = (next.dailyLog[today] || 0) + 1;
      }
      localStorage.setItem(LS_PROGRESS, JSON.stringify(next));
      return next;
    });
  }, []);

  const getNote = useCallback((slug: string) => progress.notes[slug] || '', [progress]);

  const setNote = useCallback((slug: string, text: string) => {
    setProgress(prev => {
      const next = { ...prev, notes: { ...prev.notes, [slug]: text } };
      localStorage.setItem(LS_PROGRESS, JSON.stringify(next));
      return next;
    });
  }, []);

  const setLastRead = useCallback((slug: string) => {
    setProgress(prev => {
      const next = { ...prev, lastRead: slug };
      localStorage.setItem(LS_PROGRESS, JSON.stringify(next));
      return next;
    });
  }, []);

  const completedCount = Object.keys(progress.completed).length;
  const streak = calcStreak(progress.dailyLog);

  const exportData = useCallback(() => {
    const exportObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      progress,
      highlights,
      bookmarks,
      quizScores: localStorage.getItem('iran-quiz-scores'),
      srsState: localStorage.getItem('iran-srs-state'),
      practiceHistory: localStorage.getItem('iran-practice-history'),
    };
    return JSON.stringify(exportObj, null, 2);
  }, [progress, highlights, bookmarks]);

  const importData = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.version !== 1) return false;

      if (parsed.progress) {
        const { completed, notes, lastRead, dailyLog } = parsed.progress;
        const newProgress = {
          completed: completed || {},
          notes: notes || {},
          lastRead: lastRead || null,
          dailyLog: dailyLog || {},
        };
        setProgress(newProgress);
        localStorage.setItem(LS_PROGRESS, JSON.stringify(newProgress));
      }

      if (parsed.quizScores) {
        localStorage.setItem('iran-quiz-scores', parsed.quizScores);
      }
      if (parsed.srsState) {
        localStorage.setItem('iran-srs-state', parsed.srsState);
      }
      if (parsed.practiceHistory) {
        localStorage.setItem('iran-practice-history', parsed.practiceHistory);
      }

      if (parsed.highlights) {
        setHighlights(parsed.highlights);
        localStorage.setItem(LS_HIGHLIGHTS, JSON.stringify(parsed.highlights));
      }
      if (parsed.bookmarks) {
        setBookmarks(parsed.bookmarks);
        localStorage.setItem(LS_BOOKMARKS, JSON.stringify(parsed.bookmarks));
      }

      return true;
    } catch (e) {
      return false;
    }
  }, []);

  // Highlight functions
  const addHighlight = useCallback((slug: string, text: string, color: Highlight['color'] = 'yellow'): string => {
    const id = `hl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newHighlight: Highlight = {
      id,
      slug,
      text,
      color,
      createdAt: Date.now(),
    };
    setHighlights(prev => {
      const next = [...prev, newHighlight];
      localStorage.setItem(LS_HIGHLIGHTS, JSON.stringify(next));
      return next;
    });
    return id;
  }, []);

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => {
      const next = prev.filter(h => h.id !== id);
      localStorage.setItem(LS_HIGHLIGHTS, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateHighlightNote = useCallback((id: string, note: string) => {
    setHighlights(prev => {
      const next = prev.map(h => h.id === id ? { ...h, note } : h);
      localStorage.setItem(LS_HIGHLIGHTS, JSON.stringify(next));
      return next;
    });
  }, []);

  const getHighlightsForLecture = useCallback((slug: string) => {
    return highlights.filter(h => h.slug === slug);
  }, [highlights]);

  // Bookmark functions
  const addBookmark = useCallback((slug: string, title: string) => {
    setBookmarks(prev => {
      if (prev.some(b => b.slug === slug)) return prev;
      const next = [...prev, { slug, title, createdAt: Date.now() }];
      localStorage.setItem(LS_BOOKMARKS, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeBookmark = useCallback((slug: string) => {
    setBookmarks(prev => {
      const next = prev.filter(b => b.slug !== slug);
      localStorage.setItem(LS_BOOKMARKS, JSON.stringify(next));
      return next;
    });
  }, []);

  const isBookmarked = useCallback((slug: string) => {
    return bookmarks.some(b => b.slug === slug);
  }, [bookmarks]);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle: toggleTheme }}>
      <LanguageContext.Provider value={{ lang, setLang, isRtl: lang === 'fa' }}>
        <ProgressContext.Provider
          value={{
            state: progress,
            completed: progress.completed,
            dailyLog: progress.dailyLog,
            isCompleted,
            toggleCompleted,
            getNote,
            setNote,
            setLastRead,
            completedCount,
            streak,
            exportData,
            importData,
            isSyncing,
          }}
        >
          <HighlightsContext.Provider
            value={{
              highlights,
              bookmarks,
              addHighlight,
              removeHighlight,
              updateHighlightNote,
              getHighlightsForLecture,
              addBookmark,
              removeBookmark,
              isBookmarked,
            }}
          >
            {children}
          </HighlightsContext.Provider>
        </ProgressContext.Provider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
}
