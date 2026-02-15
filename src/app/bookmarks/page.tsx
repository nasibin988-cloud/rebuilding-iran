'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useHighlights, Highlight } from '@/components/Providers';
import { SECTION_MAP } from '@/lib/types';

type Tab = 'bookmarks' | 'highlights';

const HIGHLIGHT_COLORS: Record<Highlight['color'], string> = {
  yellow: 'bg-yellow-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  pink: 'bg-pink-400',
};

export default function BookmarksPage() {
  const { bookmarks, highlights, removeBookmark, removeHighlight, updateHighlightNote } = useHighlights();
  const [tab, setTab] = useState<Tab>('bookmarks');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const groupedHighlights = highlights.reduce((acc, hl) => {
    if (!acc[hl.slug]) acc[hl.slug] = [];
    acc[hl.slug].push(hl);
    return acc;
  }, {} as Record<string, Highlight[]>);

  const getLectureInfo = (slug: string) => {
    const [sectionNum] = slug.split('-');
    const section = SECTION_MAP[sectionNum];
    return {
      sectionName: section?.name || 'Unknown Section',
      sectionNum,
    };
  };

  const startEditNote = (hl: Highlight) => {
    setEditingNote(hl.id);
    setNoteText(hl.note || '');
  };

  const saveNote = (id: string) => {
    updateHighlightNote(id, noteText);
    setEditingNote(null);
    setNoteText('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookmarks & Highlights</h1>
          <p className="text-dark-400 text-sm mt-1">
            {bookmarks.length} bookmarks, {highlights.length} highlights
          </p>
        </div>
        <Link href="/" className="text-dark-400 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('bookmarks')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'bookmarks'
              ? 'bg-persian-600 text-white'
              : 'bg-dark-800 hover:bg-dark-700'
          }`}
        >
          Bookmarks ({bookmarks.length})
        </button>
        <button
          onClick={() => setTab('highlights')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'highlights'
              ? 'bg-persian-600 text-white'
              : 'bg-dark-800 hover:bg-dark-700'
          }`}
        >
          Highlights ({highlights.length})
        </button>
      </div>

      {/* Bookmarks Tab */}
      {tab === 'bookmarks' && (
        <div className="space-y-3">
          {bookmarks.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-dark-500 mb-3">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
              </svg>
              <p className="text-dark-400">No bookmarks yet</p>
              <p className="text-dark-500 text-sm mt-1">Click the bookmark button on any lecture to save it here</p>
            </div>
          ) : (
            bookmarks
              .sort((a, b) => b.createdAt - a.createdAt)
              .map(bm => {
                const info = getLectureInfo(bm.slug);
                return (
                  <div key={bm.slug} className="glass-card rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-saffron-500/20 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" className="text-saffron-500">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/lecture/${bm.slug}`} className="font-medium hover:text-persian-400 transition-colors block truncate">
                        {bm.title}
                      </Link>
                      <p className="text-2xs text-dark-500">
                        {info.sectionName} &middot; {new Date(bm.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeBookmark(bm.slug)}
                      className="text-dark-500 hover:text-red-400 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Highlights Tab */}
      {tab === 'highlights' && (
        <div className="space-y-6">
          {Object.keys(groupedHighlights).length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-dark-500 mb-3">
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
              </svg>
              <p className="text-dark-400">No highlights yet</p>
              <p className="text-dark-500 text-sm mt-1">Select text in any lecture and choose a highlight color</p>
            </div>
          ) : (
            Object.entries(groupedHighlights)
              .sort(([, a], [, b]) => Math.max(...b.map(h => h.createdAt)) - Math.max(...a.map(h => h.createdAt)))
              .map(([slug, hls]) => {
                const info = getLectureInfo(slug);
                return (
                  <div key={slug} className="glass-card rounded-xl p-4">
                    <Link href={`/lecture/${slug}`} className="font-medium hover:text-persian-400 transition-colors">
                      {slug}: {info.sectionName}
                    </Link>
                    <div className="mt-3 space-y-3">
                      {hls.sort((a, b) => a.createdAt - b.createdAt).map(hl => (
                        <div key={hl.id} className="flex items-start gap-3 group">
                          <span className={`w-1 self-stretch rounded ${HIGHLIGHT_COLORS[hl.color]}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">&ldquo;{hl.text}&rdquo;</p>
                            {editingNote === hl.id ? (
                              <div className="mt-2 flex gap-2">
                                <input
                                  type="text"
                                  value={noteText}
                                  onChange={e => setNoteText(e.target.value)}
                                  placeholder="Add a note..."
                                  className="flex-1 px-2 py-1 bg-dark-800 border border-dark-700 rounded text-2xs"
                                  autoFocus
                                  onKeyDown={e => e.key === 'Enter' && saveNote(hl.id)}
                                />
                                <button
                                  onClick={() => saveNote(hl.id)}
                                  className="px-2 py-1 bg-persian-600 text-white rounded text-2xs"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingNote(null)}
                                  className="px-2 py-1 bg-dark-700 rounded text-2xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                {hl.note ? (
                                  <p className="text-2xs text-dark-400">{hl.note}</p>
                                ) : (
                                  <button
                                    onClick={() => startEditNote(hl)}
                                    className="text-2xs text-dark-500 hover:text-persian-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    + Add note
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {hl.note && (
                              <button
                                onClick={() => startEditNote(hl)}
                                className="text-dark-500 hover:text-white"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => removeHighlight(hl.id)}
                              className="text-dark-500 hover:text-red-400"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
}
