'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LectureFull, LectureMeta, Section } from '@/lib/types';
import { useProgress, useHighlights, Highlight } from './Providers';
import StudyPanel from './StudyPanel';
import Discussion from './Discussion';
import { addCrossReferenceLinks, extractCrossReferences } from '@/lib/crossReferences';

type ViewMode = 'standard' | 'extended' | 'scholarly';

interface Props {
  lecture: LectureFull;
  extendedHtml: string | null;
  extendedReadingTime: number | null;
  scholarlyHtml: string | null;
  scholarlyReadingTime: number | null;
  prev: LectureMeta | null;
  next: LectureMeta | null;
  sections: Section[];
}

export default function LectureClient({ lecture, extendedHtml, extendedReadingTime, scholarlyHtml, scholarlyReadingTime, prev, next, sections }: Props) {
  const router = useRouter();
  const { isCompleted, toggleCompleted, getNote, setNote, setLastRead } = useProgress();
  const { addHighlight, removeHighlight, getHighlightsForLecture, addBookmark, removeBookmark, isBookmarked } = useHighlights();
  const [noteText, setNoteText] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightMenuPos, setHighlightMenuPos] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showHighlightsPanel, setShowHighlightsPanel] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const completed = isCompleted(lecture.slug);
  const bookmarked = isBookmarked(lecture.slug);
  const lectureHighlights = getHighlightsForLecture(lecture.slug);

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window);
  }, []);

  // Cancel speech on unmount or navigation
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [lecture.slug]);

  // Handle text selection for highlighting
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setShowHighlightMenu(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3 || text.length > 500) {
      setShowHighlightMenu(false);
      return;
    }

    // Get position for menu
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectedText(text);
    setHighlightMenuPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setShowHighlightMenu(true);
  }, []);

  const handleHighlight = useCallback((color: Highlight['color']) => {
    if (selectedText) {
      addHighlight(lecture.slug, selectedText, color);
      setShowHighlightMenu(false);
      setSelectedText('');
      window.getSelection()?.removeAllRanges();
    }
  }, [selectedText, lecture.slug, addHighlight]);

  // Listen for text selection
  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    article.addEventListener('mouseup', handleTextSelection);
    article.addEventListener('touchend', handleTextSelection);

    return () => {
      article.removeEventListener('mouseup', handleTextSelection);
      article.removeEventListener('touchend', handleTextSelection);
    };
  }, [handleTextSelection]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'j':
          // Next lecture
          if (next) {
            router.push(`/lecture/${next.slug}`);
          }
          break;
        case 'k':
          // Previous lecture
          if (prev) {
            router.push(`/lecture/${prev.slug}`);
          }
          break;
        case 'm':
          // Toggle completed
          toggleCompleted(lecture.slug);
          break;
        case 'n':
          // Toggle notes
          setShowNotes(s => !s);
          break;
        case '1':
          setViewMode('standard');
          break;
        case '2':
          if (extendedHtml) setViewMode('extended');
          break;
        case '3':
          if (scholarlyHtml) setViewMode('scholarly');
          break;
        case '?':
          setShowShortcuts(s => !s);
          break;
        case 'escape':
          setShowShortcuts(false);
          setShowNotes(false);
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev, router, lecture.slug, toggleCompleted, extendedHtml, scholarlyHtml]);

  const hasExtended = extendedHtml !== null;
  const hasScholarly = scholarlyHtml !== null;
  const rawActiveHtml = viewMode === 'scholarly' && hasScholarly ? scholarlyHtml
    : viewMode === 'extended' && hasExtended ? extendedHtml
    : lecture.html;
  const activeReadingTime = viewMode === 'scholarly' && hasScholarly && scholarlyReadingTime ? scholarlyReadingTime
    : viewMode === 'extended' && hasExtended && extendedReadingTime ? extendedReadingTime
    : lecture.readingTime;

  // Process HTML to add cross-reference links
  const activeHtml = useMemo(() => {
    return addCrossReferenceLinks(rawActiveHtml, lecture.slug);
  }, [rawActiveHtml, lecture.slug]);

  // TTS toggle - must be after activeHtml is defined
  const toggleSpeech = useCallback(() => {
    if (!speechSupported) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Extract text from lecture content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = activeHtml;
    const text = tempDiv.textContent || tempDiv.innerText || '';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [isSpeaking, speechSupported, activeHtml]);

  // Extract related sections for sidebar (if any)
  const relatedRefs = useMemo(() => {
    return extractCrossReferences(rawActiveHtml, lecture.slug);
  }, [rawActiveHtml, lecture.slug]);

  useEffect(() => {
    setLastRead(lecture.slug);
  }, [lecture.slug, setLastRead]);

  useEffect(() => {
    setNoteText(getNote(lecture.slug));
  }, [lecture.slug, getNote]);

  const saveNote = () => {
    setNote(lecture.slug, noteText);
  };

  // Build table of contents from headings
  const headings = activeHtml.match(/<h[23][^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/g) || [];
  const toc = headings.map(h => {
    const idMatch = h.match(/id="([^"]*)"/);
    const textMatch = h.match(/>(.*?)<\//);
    const level = h.startsWith('<h3') ? 3 : 2;
    return {
      id: idMatch?.[1] || '',
      text: textMatch?.[1]?.replace(/<[^>]*>/g, '') || '',
      level,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-2xs text-dark-500 dark:text-dark-400 mb-4 sm:mb-6 overflow-x-auto">
        <Link href="/" className="hover:text-persian-600 dark:hover:text-persian-400 transition-colors shrink-0">Home</Link>
        <span className="shrink-0">/</span>
        <span className="shrink-0">{lecture.act}</span>
        <span className="shrink-0">/</span>
        <span className="text-dark-600 dark:text-dark-300 truncate">{lecture.sectionName}</span>
      </div>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2 sm:mb-3">
          <span className="text-xs font-mono text-dark-400">{lecture.slug}</span>
          <span className="text-2xs text-dark-400">{activeReadingTime} min read</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold mb-4">{lecture.title}</h1>

        {/* Actions - Responsive Grid */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => toggleCompleted(lecture.slug)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              completed
                ? 'bg-turquoise-100 dark:bg-turquoise-900/30 text-turquoise-700 dark:text-turquoise-300'
                : 'bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700'
            }`}
          >
            {completed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <span className="w-4 h-4 rounded-full border-2 border-dark-300 dark:border-dark-600" />
            )}
            {completed ? 'Completed' : 'Mark Complete'}
          </button>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Notes
          </button>
          <button
            onClick={() => bookmarked ? removeBookmark(lecture.slug) : addBookmark(lecture.slug, lecture.title)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              bookmarked
                ? 'bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-300'
                : 'bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
            </svg>
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          {lectureHighlights.length > 0 && (
            <button
              onClick={() => setShowHighlightsPanel(!showHighlightsPanel)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
              </svg>
              {lectureHighlights.length} Highlights
            </button>
          )}
          {speechSupported && (
            <button
              onClick={toggleSpeech}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                isSpeaking
                  ? 'bg-saffron-600 text-white'
                  : 'bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700'
              }`}
            >
              {isSpeaking ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  </svg>
                  Listen
                </>
              )}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors no-print"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
          {(hasExtended || hasScholarly) && (
            <div className="flex items-center rounded-lg overflow-hidden border border-dark-200 dark:border-dark-700 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('standard')}
                className={`flex-1 sm:flex-none px-3 py-2 text-xs font-medium transition-colors ${
                  viewMode === 'standard'
                    ? 'bg-persian-600 text-white'
                    : 'bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700'
                }`}
              >
                Standard
              </button>
              {hasExtended && (
                <button
                  onClick={() => setViewMode('extended')}
                  className={`flex-1 sm:flex-none px-3 py-2 text-xs font-medium transition-colors border-l border-dark-200 dark:border-dark-700 ${
                    viewMode === 'extended'
                      ? 'bg-persian-600 text-white'
                      : 'bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700'
                  }`}
                >
                  Extended
                </button>
              )}
              {hasScholarly && (
                <button
                  onClick={() => setViewMode('scholarly')}
                  className={`flex-1 sm:flex-none px-3 py-2 text-xs font-medium transition-colors border-l border-dark-200 dark:border-dark-700 ${
                    viewMode === 'scholarly'
                      ? 'bg-saffron-600 text-white'
                      : 'bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700'
                  }`}
                >
                  Scholarly
                </button>
              )}
            </div>
          )}
        </div>

        {/* Top Navigation */}
        {(prev || next) && (
          <div className="hidden sm:flex items-center justify-between mt-5 pt-4 border-t border-dark-200/50 dark:border-dark-700/50">
            {prev ? (
              <Link href={`/lecture/${prev.slug}`} className="flex items-center gap-1.5 text-2xs hover:text-persian-600 dark:hover:text-persian-400 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                <span className="text-dark-400">Prev:</span>
                <span className="font-medium truncate max-w-[200px]">{prev.title}</span>
              </Link>
            ) : <div />}
            {next ? (
              <Link href={`/lecture/${next.slug}`} className="flex items-center gap-1.5 text-2xs hover:text-persian-600 dark:hover:text-persian-400 transition-colors">
                <span className="font-medium truncate max-w-[200px]">{next.title}</span>
                <span className="text-dark-400">:Next</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            ) : <div />}
          </div>
        )}
      </div>

      {/* Notes Panel */}
      {showNotes && (
        <div className="glass-card rounded-xl p-4 mb-8">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onBlur={saveNote}
            placeholder="Write your notes here..."
            className="w-full h-32 bg-transparent outline-none resize-none text-sm placeholder:text-dark-400"
          />
          <div className="flex justify-end">
            <button
              onClick={saveNote}
              className="px-3 py-1 rounded text-2xs font-medium bg-persian-600 text-white hover:bg-persian-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Highlights Panel */}
      {showHighlightsPanel && lectureHighlights.length > 0 && (
        <div className="glass-card rounded-xl p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Your Highlights</h3>
            <button
              onClick={() => setShowHighlightsPanel(false)}
              className="text-dark-400 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {lectureHighlights.map(hl => (
              <div key={hl.id} className="flex items-start gap-2">
                <span
                  className={`w-1 shrink-0 self-stretch rounded ${
                    hl.color === 'yellow' ? 'bg-yellow-400' :
                    hl.color === 'green' ? 'bg-green-400' :
                    hl.color === 'blue' ? 'bg-blue-400' : 'bg-pink-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-dark-300">&ldquo;{hl.text}&rdquo;</p>
                  {hl.note && <p className="text-2xs text-dark-500 mt-1">{hl.note}</p>}
                </div>
                <button
                  onClick={() => removeHighlight(hl.id)}
                  className="text-dark-500 hover:text-red-400 shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Layout */}
      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Citation Notice for Scholarly Content */}
          {viewMode === 'scholarly' && (
            <div className="mb-6 p-4 rounded-lg bg-saffron-500/10 border border-saffron-500/30">
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-saffron-500 shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <p className="text-sm font-medium text-saffron-400">AI-Generated Scholarly Content</p>
                  <p className="text-xs text-dark-400 mt-1">
                    This scholarly tier content references academic sources and names scholars. While based on training data,
                    specific citations should be independently verified before academic use.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Extended Content Notice */}
          {viewMode === 'extended' && (
            <div className="mb-6 p-3 rounded-lg bg-persian-500/10 border border-persian-500/30">
              <p className="text-xs text-dark-400">
                <span className="font-medium text-persian-400">Extended View:</span> This version includes additional context,
                analysis, and deeper exploration of the topic.
              </p>
            </div>
          )}

          <article
            ref={articleRef}
            className="prose-iran"
            dangerouslySetInnerHTML={{ __html: activeHtml }}
          />

          {/* Discussion Section */}
          <Discussion lectureSlug={lecture.slug} />

          {/* Highlight Menu */}
          {showHighlightMenu && (
            <div
              className="fixed z-50 bg-dark-900 border border-dark-700 rounded-lg shadow-xl flex items-center gap-1 p-1"
              style={{
                left: highlightMenuPos.x,
                top: highlightMenuPos.y,
                transform: 'translate(-50%, -100%)',
              }}
              onMouseDown={e => e.preventDefault()}
            >
              <button
                onClick={() => handleHighlight('yellow')}
                className="w-6 h-6 rounded bg-yellow-400 hover:scale-110 transition-transform"
                title="Yellow highlight"
              />
              <button
                onClick={() => handleHighlight('green')}
                className="w-6 h-6 rounded bg-green-400 hover:scale-110 transition-transform"
                title="Green highlight"
              />
              <button
                onClick={() => handleHighlight('blue')}
                className="w-6 h-6 rounded bg-blue-400 hover:scale-110 transition-transform"
                title="Blue highlight"
              />
              <button
                onClick={() => handleHighlight('pink')}
                className="w-6 h-6 rounded bg-pink-400 hover:scale-110 transition-transform"
                title="Pink highlight"
              />
              <button
                onClick={() => setShowHighlightMenu(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-dark-400 hover:text-white"
                title="Cancel"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Table of Contents & Related Sections */}
        {(toc.length > 0 || relatedRefs.length > 0) && (
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-8 space-y-6">
              {toc.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-dark-400 mb-3">On this page</h3>
                  <nav className="space-y-1">
                    {toc.map(item => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-2xs hover:text-persian-600 dark:hover:text-persian-400 transition-colors truncate ${
                          item.level === 3 ? 'pl-3 text-dark-400' : 'text-dark-500 dark:text-dark-400 font-medium'
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {relatedRefs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-dark-400 mb-3">
                    Related Sections
                  </h3>
                  <nav className="space-y-1.5">
                    {relatedRefs.slice(0, 5).map(ref => (
                      <Link
                        key={ref.slug}
                        href={`/lecture/${ref.slug}`}
                        className="flex items-center gap-2 text-2xs hover:text-persian-600 dark:hover:text-persian-400 transition-colors group"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          ref.type === 'lecture' ? 'bg-saffron-500' : 'bg-turquoise-500'
                        }`} />
                        <span className="truncate">{ref.text}</span>
                        <svg
                          width="10" height="10" viewBox="0 0 24 24"
                          fill="none" stroke="currentColor" strokeWidth="2"
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </Link>
                    ))}
                    {relatedRefs.length > 5 && (
                      <p className="text-2xs text-dark-500 mt-2">
                        +{relatedRefs.length - 5} more references
                      </p>
                    )}
                  </nav>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Study Panel */}
      <StudyPanel
        sectionNum={lecture.slug.split('-')[0]}
        lectureNum={parseInt(lecture.slug.split('-')[1], 10)}
        tier={viewMode}
      />

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-dark-400 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Next lecture</span>
                <kbd className="px-2 py-0.5 bg-dark-800 rounded text-xs">J</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Previous lecture</span>
                <kbd className="px-2 py-0.5 bg-dark-800 rounded text-xs">K</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Mark complete</span>
                <kbd className="px-2 py-0.5 bg-dark-800 rounded text-xs">M</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Toggle notes</span>
                <kbd className="px-2 py-0.5 bg-dark-800 rounded text-xs">N</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Standard view</span>
                <kbd className="px-2 py-0.5 bg-dark-800 rounded text-xs">1</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Extended view</span>
                <kbd className="px-2 py-0.5 bg-dark-800 rounded text-xs">2</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Scholarly view</span>
                <kbd className="px-2 py-0.5 bg-dark-800 rounded text-xs">3</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Show shortcuts</span>
                <kbd className="px-2 py-0.5 bg-dark-800 rounded text-xs">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut Hint */}
      <div className="hidden sm:flex fixed bottom-4 right-4 z-30">
        <button
          onClick={() => setShowShortcuts(true)}
          className="px-3 py-1.5 bg-dark-800/90 backdrop-blur border border-dark-700 rounded-lg text-2xs text-dark-400 hover:text-white transition-colors"
        >
          Press <kbd className="px-1.5 py-0.5 bg-dark-700 rounded mx-1">?</kbd> for shortcuts
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-dark-200 dark:border-dark-800">
        {prev ? (
          <Link
            href={`/lecture/${prev.slug}`}
            className="flex items-center gap-2 text-sm hover:text-persian-600 dark:hover:text-persian-400 transition-colors p-3 sm:p-0 rounded-lg sm:rounded-none bg-dark-100/50 dark:bg-dark-800/50 sm:bg-transparent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M15 18l-6-6 6-6"/></svg>
            <div className="min-w-0">
              <div className="text-2xs text-dark-400">Previous</div>
              <div className="font-medium truncate">{prev.title}</div>
            </div>
          </Link>
        ) : <div className="hidden sm:block" />}
        {next ? (
          <Link
            href={`/lecture/${next.slug}`}
            className="flex items-center gap-2 text-sm text-right hover:text-persian-600 dark:hover:text-persian-400 transition-colors p-3 sm:p-0 rounded-lg sm:rounded-none bg-dark-100/50 dark:bg-dark-800/50 sm:bg-transparent justify-end"
          >
            <div className="min-w-0">
              <div className="text-2xs text-dark-400">Next</div>
              <div className="font-medium truncate">{next.title}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M9 18l6-6-6-6"/></svg>
          </Link>
        ) : <div className="hidden sm:block" />}
      </div>
    </div>
  );
}
