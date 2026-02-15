'use client';

import { createClient } from './client';
import { ProgressState } from '@/lib/types';
import { Highlight, Bookmark } from '@/components/Providers';

const supabase = createClient();

// Sync local progress to server
export async function syncProgressToServer(
  userId: string,
  progress: ProgressState,
  highlights: Highlight[],
  bookmarks: Bookmark[]
) {
  // Sync completed lectures
  const completedEntries = Object.entries(progress.completed);
  if (completedEntries.length > 0) {
    const progressRecords = completedEntries.map(([slug, timestamp]) => ({
      user_id: userId,
      lecture_slug: slug,
      completed_at: new Date(timestamp).toISOString(),
      tier_viewed: 'standard', // Default tier
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
      user_id: userId,
      lecture_slug: slug,
      content,
    }));

    await supabase
      .from('notes')
      .upsert(noteRecords, { onConflict: 'user_id,lecture_slug' });
  }

  // Sync highlights
  if (highlights.length > 0) {
    const highlightRecords = highlights.map(h => ({
      id: h.id,
      user_id: userId,
      lecture_slug: h.slug,
      text: h.text,
      color: h.color,
      note: h.note || null,
      created_at: new Date(h.createdAt).toISOString(),
    }));

    // Delete old and insert new (simplest approach for initial sync)
    await supabase.from('highlights').delete().eq('user_id', userId);
    await supabase.from('highlights').insert(highlightRecords);
  }

  // Sync bookmarks
  if (bookmarks.length > 0) {
    const bookmarkRecords = bookmarks.map(b => ({
      user_id: userId,
      lecture_slug: b.slug,
      note: null,
      created_at: new Date(b.createdAt).toISOString(),
    }));

    await supabase.from('bookmarks').delete().eq('user_id', userId);
    await supabase.from('bookmarks').upsert(bookmarkRecords, { onConflict: 'user_id,lecture_slug' });
  }
}

// Fetch progress from server
export async function fetchProgressFromServer(userId: string) {
  const [progressRes, notesRes, highlightsRes, bookmarksRes] = await Promise.all([
    supabase.from('progress').select('*').eq('user_id', userId),
    supabase.from('notes').select('*').eq('user_id', userId),
    supabase.from('highlights').select('*').eq('user_id', userId),
    supabase.from('bookmarks').select('*').eq('user_id', userId),
  ]);

  // Convert to local format
  const completed: Record<string, number> = {};
  const dailyLog: Record<string, number> = {};

  if (progressRes.data) {
    for (const p of progressRes.data) {
      completed[p.lecture_slug] = new Date(p.completed_at).getTime();
      const dateKey = p.completed_at.slice(0, 10);
      dailyLog[dateKey] = (dailyLog[dateKey] || 0) + 1;
    }
  }

  const notes: Record<string, string> = {};
  if (notesRes.data) {
    for (const n of notesRes.data) {
      notes[n.lecture_slug] = n.content;
    }
  }

  const highlights: Highlight[] = [];
  if (highlightsRes.data) {
    for (const h of highlightsRes.data) {
      highlights.push({
        id: h.id,
        slug: h.lecture_slug,
        text: h.text,
        color: h.color as Highlight['color'],
        note: h.note || undefined,
        createdAt: new Date(h.created_at).getTime(),
      });
    }
  }

  const bookmarks: Bookmark[] = [];
  if (bookmarksRes.data) {
    for (const b of bookmarksRes.data) {
      bookmarks.push({
        slug: b.lecture_slug,
        title: '', // Title needs to be fetched from content
        createdAt: new Date(b.created_at).getTime(),
      });
    }
  }

  return {
    progress: {
      completed,
      notes,
      lastRead: null,
      dailyLog,
    },
    highlights,
    bookmarks,
  };
}

// Sync quiz attempts
export async function syncQuizAttempt(
  userId: string,
  sectionNum: number,
  score: number,
  totalQuestions: number,
  answers: Record<string, string>
) {
  await supabase.from('quiz_attempts').insert({
    user_id: userId,
    section_num: sectionNum,
    score,
    total_questions: totalQuestions,
    answers,
  });
}

// Fetch quiz attempts for a user
export async function fetchQuizAttempts(userId: string) {
  const { data } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return data || [];
}
