'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Section, ACT_MAP } from '@/lib/types';
import { useProgress, useHighlights } from '@/components/Providers';

const ACT_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-turquoise-500/20', text: 'text-turquoise-400', border: 'border-turquoise-500' },
  2: { bg: 'bg-persian-500/20', text: 'text-persian-400', border: 'border-persian-500' },
  3: { bg: 'bg-saffron-500/20', text: 'text-saffron-400', border: 'border-saffron-500' },
  4: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500' },
};

// Achievement definitions
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: (stats: AchievementStats) => boolean;
  tier: 'bronze' | 'silver' | 'gold';
}

interface AchievementStats {
  completed: number;
  total: number;
  streak: number;
  quizzesTaken: number;
  quizAverage: number;
  highlights: number;
  bookmarks: number;
  daysActive: number;
  actsCompleted: number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Completion achievements
  { id: 'first-lecture', name: 'First Steps', description: 'Complete your first lecture', icon: '🌱', requirement: s => s.completed >= 1, tier: 'bronze' },
  { id: 'ten-lectures', name: 'Getting Started', description: 'Complete 10 lectures', icon: '📚', requirement: s => s.completed >= 10, tier: 'bronze' },
  { id: 'fifty-lectures', name: 'Dedicated Learner', description: 'Complete 50 lectures', icon: '🎓', requirement: s => s.completed >= 50, tier: 'silver' },
  { id: 'hundred-lectures', name: 'Scholar', description: 'Complete 100 lectures', icon: '🏛️', requirement: s => s.completed >= 100, tier: 'gold' },
  { id: 'all-lectures', name: 'Master', description: 'Complete all lectures', icon: '👑', requirement: s => s.completed >= s.total && s.total > 0, tier: 'gold' },

  // Act achievements
  { id: 'act-one', name: 'Historian', description: 'Complete all of Act I', icon: '📜', requirement: s => s.actsCompleted >= 1, tier: 'silver' },
  { id: 'act-two', name: 'Philosopher', description: 'Complete all of Act II', icon: '🏺', requirement: s => s.actsCompleted >= 2, tier: 'silver' },
  { id: 'act-three', name: 'Analyst', description: 'Complete all of Act III', icon: '⚖️', requirement: s => s.actsCompleted >= 3, tier: 'silver' },
  { id: 'act-four', name: 'Visionary', description: 'Complete all of Act IV', icon: '🌟', requirement: s => s.actsCompleted >= 4, tier: 'gold' },

  // Streak achievements
  { id: 'streak-3', name: 'Consistent', description: 'Maintain a 3-day streak', icon: '🔥', requirement: s => s.streak >= 3, tier: 'bronze' },
  { id: 'streak-7', name: 'Committed', description: 'Maintain a 7-day streak', icon: '💪', requirement: s => s.streak >= 7, tier: 'silver' },
  { id: 'streak-30', name: 'Unstoppable', description: 'Maintain a 30-day streak', icon: '⭐', requirement: s => s.streak >= 30, tier: 'gold' },

  // Quiz achievements
  { id: 'first-quiz', name: 'Test Taker', description: 'Complete your first quiz', icon: '✏️', requirement: s => s.quizzesTaken >= 1, tier: 'bronze' },
  { id: 'quiz-master', name: 'Quiz Master', description: 'Score 90%+ average on quizzes', icon: '🏆', requirement: s => s.quizzesTaken >= 5 && s.quizAverage >= 90, tier: 'gold' },

  // Engagement achievements
  { id: 'highlighter', name: 'Highlighter', description: 'Create 10 highlights', icon: '🖍️', requirement: s => s.highlights >= 10, tier: 'bronze' },
  { id: 'bookworm', name: 'Bookworm', description: 'Bookmark 5 lectures', icon: '📖', requirement: s => s.bookmarks >= 5, tier: 'bronze' },
  { id: 'regular', name: 'Regular', description: 'Be active for 10 different days', icon: '📅', requirement: s => s.daysActive >= 10, tier: 'silver' },
];

// XP calculation
const calculateXP = (stats: AchievementStats, achievements: string[]): { xp: number; level: number; nextLevel: number } => {
  let xp = 0;

  // XP from lectures (10 XP each)
  xp += stats.completed * 10;

  // XP from streak (2 XP per day)
  xp += stats.streak * 2;

  // XP from quizzes (based on score)
  xp += Math.floor(stats.quizzesTaken * stats.quizAverage / 10);

  // XP from achievements
  achievements.forEach(id => {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement) {
      xp += achievement.tier === 'gold' ? 100 : achievement.tier === 'silver' ? 50 : 25;
    }
  });

  // Calculate level (every 100 XP = 1 level)
  const level = Math.floor(xp / 100) + 1;
  const nextLevel = level * 100;

  return { xp, level, nextLevel };
};

interface QuizScores {
  [section: string]: { correct: number; total: number };
}

interface SRSState {
  [cardId: string]: {
    interval: number;
    repetitions: number;
    easeFactor: number;
    nextReview: number;
  };
}

interface Props {
  sections: Section[];
}

export default function ProgressClient({ sections }: Props) {
  const { completed, dailyLog, streak, completedCount, exportData, importData } = useProgress();
  const { highlights, bookmarks } = useHighlights();
  const [quizScores, setQuizScores] = useState<QuizScores>({});
  const [srsState, setSrsState] = useState<SRSState>({});
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [dailyGoal, setDailyGoal] = useState(3);

  // Load daily goal from localStorage
  useEffect(() => {
    const savedGoal = localStorage.getItem('iran-daily-goal');
    if (savedGoal) {
      setDailyGoal(parseInt(savedGoal, 10));
    }
  }, []);

  const updateDailyGoal = (goal: number) => {
    setDailyGoal(goal);
    localStorage.setItem('iran-daily-goal', goal.toString());
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rebuilding-iran-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const success = importData(importText);
    setImportStatus(success ? 'success' : 'error');
    if (success) {
      setTimeout(() => {
        setShowImport(false);
        setImportText('');
        setImportStatus('idle');
        window.location.reload();
      }, 1500);
    }
  };

  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0);
  const progressPct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

  // Load quiz scores and SRS state
  useEffect(() => {
    const scores = localStorage.getItem('iran-quiz-scores');
    if (scores) {
      try {
        setQuizScores(JSON.parse(scores));
      } catch (e) {}
    }

    const srs = localStorage.getItem('iran-srs-state');
    if (srs) {
      try {
        setSrsState(JSON.parse(srs));
      } catch (e) {}
    }
  }, []);

  // Calculate stats per act
  const actStats = useMemo(() => {
    const stats: Record<number, { completed: number; total: number; quizCorrect: number; quizTotal: number }> = {};

    for (let actNum = 1; actNum <= 4; actNum++) {
      const actSections = sections.filter(s => s.actNum === actNum);
      const sectionNums = actSections.map(s => s.num);

      const completedInAct = actSections.reduce(
        (sum, s) => sum + s.lectures.filter(l => completed[l.slug]).length,
        0
      );
      const totalInAct = actSections.reduce((sum, s) => sum + s.lectures.length, 0);

      let quizCorrect = 0;
      let quizTotal = 0;
      for (const num of sectionNums) {
        if (quizScores[num]) {
          quizCorrect += quizScores[num].correct;
          quizTotal += quizScores[num].total;
        }
      }

      stats[actNum] = { completed: completedInAct, total: totalInAct, quizCorrect, quizTotal };
    }

    return stats;
  }, [sections, completed, quizScores]);

  // Calculate SRS stats
  const srsStats = useMemo(() => {
    const cards = Object.values(srsState);
    const now = Date.now();

    const due = cards.filter(c => c.nextReview <= now).length;
    const learning = cards.filter(c => c.repetitions < 3).length;
    const mature = cards.filter(c => c.repetitions >= 3 && c.interval >= 21).length;
    const young = cards.length - learning - mature;

    const avgEaseFactor = cards.length > 0
      ? cards.reduce((sum, c) => sum + c.easeFactor, 0) / cards.length
      : 2.5;

    return { total: cards.length, due, learning, young, mature, avgEaseFactor };
  }, [srsState]);

  // Calculate achievement stats
  const achievementStats = useMemo((): AchievementStats => {
    // Count quizzes and calculate average
    let quizzesTaken = 0;
    let totalQuizScore = 0;
    Object.values(quizScores).forEach(score => {
      if (score.total > 0) {
        quizzesTaken++;
        totalQuizScore += (score.correct / score.total) * 100;
      }
    });
    const quizAverage = quizzesTaken > 0 ? totalQuizScore / quizzesTaken : 0;

    // Count acts completed
    let actsCompleted = 0;
    for (let actNum = 1; actNum <= 4; actNum++) {
      const actSections = sections.filter(s => s.actNum === actNum);
      const allLecturesInAct = actSections.flatMap(s => s.lectures);
      if (allLecturesInAct.length > 0 && allLecturesInAct.every(l => completed[l.slug])) {
        actsCompleted++;
      }
    }

    // Count active days
    const daysActive = Object.keys(dailyLog).filter(d => dailyLog[d] > 0).length;

    return {
      completed: completedCount,
      total: totalLectures,
      streak,
      quizzesTaken,
      quizAverage,
      highlights: highlights.length,
      bookmarks: bookmarks.length,
      daysActive,
      actsCompleted,
    };
  }, [completedCount, totalLectures, streak, quizScores, sections, completed, dailyLog, highlights, bookmarks]);

  // Calculate unlocked achievements
  const unlockedAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(a => a.requirement(achievementStats)).map(a => a.id);
  }, [achievementStats]);

  // Calculate XP and level
  const { xp, level, nextLevel } = useMemo(() => {
    return calculateXP(achievementStats, unlockedAchievements);
  }, [achievementStats, unlockedAchievements]);

  // Today's progress
  const todayKey = new Date().toISOString().split('T')[0];
  const todayProgress = dailyLog[todayKey] || 0;
  const goalProgress = Math.min(todayProgress / dailyGoal * 100, 100);

  // Activity heatmap data (last 90 days)
  const activityData = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        count: dailyLog[dateStr] || 0,
      });
    }

    return days;
  }, [dailyLog]);

  // Get color intensity for heatmap
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-dark-800';
    if (count === 1) return 'bg-turquoise-900';
    if (count <= 3) return 'bg-turquoise-700';
    if (count <= 5) return 'bg-turquoise-500';
    return 'bg-turquoise-400';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Progress Dashboard</h1>
          <p className="text-dark-400">Track your learning journey across the curriculum</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-persian-600 hover:bg-persian-700 text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Export
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-dark-700 hover:bg-dark-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            Import
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowImport(false)}>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Import Progress Data</h3>
            <p className="text-sm text-dark-400 mb-4">
              Paste the contents of your exported JSON file below. This will merge with your existing data.
            </p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="w-full h-40 bg-dark-800 border border-dark-700 rounded-lg p-3 text-sm font-mono resize-none mb-4"
              placeholder='{"version": 1, ...}'
            />
            {importStatus === 'success' && (
              <p className="text-turquoise-400 text-sm mb-4">Import successful! Reloading...</p>
            )}
            {importStatus === 'error' && (
              <p className="text-red-400 text-sm mb-4">Invalid data format. Please check your file.</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-dark-700 hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-persian-600 hover:bg-persian-700 text-white transition-colors disabled:opacity-50"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level & XP Bar */}
      <div className="glass-card rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-saffron-500 to-persian-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{level}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">Level {level}</span>
              <span className="text-sm text-dark-400">{xp} / {nextLevel} XP</span>
            </div>
            <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-saffron-500 to-persian-500 rounded-full transition-all"
                style={{ width: `${(xp % 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-2xs text-dark-400">
              <span>{unlockedAchievements.length}/{ACHIEVEMENTS.length} achievements</span>
              <span>&middot;</span>
              <span>{streak > 0 ? `${streak} day streak 🔥` : 'Start a streak!'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Goal & Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {/* Daily Goal - spans 2 columns on mobile */}
        <div className="col-span-2 sm:col-span-1 glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs text-dark-400">Today's Goal</span>
            <select
              value={dailyGoal}
              onChange={e => updateDailyGoal(parseInt(e.target.value))}
              className="bg-dark-800 text-2xs rounded px-1 py-0.5"
            >
              {[1, 2, 3, 5, 7, 10].map(n => (
                <option key={n} value={n}>{n}/day</option>
              ))}
            </select>
          </div>
          <div className="text-2xl font-bold text-turquoise-400">
            {todayProgress}/{dailyGoal}
          </div>
          <div className="mt-2 h-2 bg-dark-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                goalProgress >= 100 ? 'bg-turquoise-500' : 'bg-persian-500'
              }`}
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          {goalProgress >= 100 && (
            <div className="text-2xs text-turquoise-400 mt-1">Goal achieved! 🎉</div>
          )}
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-3xl font-bold text-turquoise-400">{progressPct}%</div>
          <div className="text-2xs text-dark-400 mt-1">Progress</div>
          <div className="mt-2 h-1.5 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-persian-500 to-turquoise-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-3xl font-bold text-persian-400">{completedCount}</div>
          <div className="text-2xs text-dark-400 mt-1">Completed</div>
          <div className="text-xs text-dark-500 mt-2">of {totalLectures}</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-1">
            <span className="text-3xl font-bold text-saffron-400">{streak}</span>
            {streak >= 3 && <span className="text-2xl">🔥</span>}
          </div>
          <div className="text-2xs text-dark-400 mt-1">Day Streak</div>
          <div className="text-xs text-dark-500 mt-2">
            {streak >= 7 ? 'Amazing!' : streak >= 3 ? 'Keep going!' : 'Build it up!'}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-3xl font-bold text-amber-400">{srsStats.due}</div>
          <div className="text-2xs text-dark-400 mt-1">Cards Due</div>
          <div className="text-xs text-dark-500 mt-2">
            <Link href="/review" className="text-persian-400 hover:underline">Review</Link>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="glass-card rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <span>Achievements</span>
          <span className="text-2xs text-dark-400">({unlockedAchievements.length}/{ACHIEVEMENTS.length})</span>
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ACHIEVEMENTS.map(achievement => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            const tierColors = {
              bronze: 'from-amber-700 to-amber-900',
              silver: 'from-gray-400 to-gray-600',
              gold: 'from-yellow-400 to-amber-500',
            };

            return (
              <div
                key={achievement.id}
                className={`relative group ${isUnlocked ? '' : 'opacity-40 grayscale'}`}
                title={`${achievement.name}: ${achievement.description}`}
              >
                <div
                  className={`aspect-square rounded-xl flex items-center justify-center text-3xl ${
                    isUnlocked
                      ? `bg-gradient-to-br ${tierColors[achievement.tier]}`
                      : 'bg-dark-800'
                  }`}
                >
                  {achievement.icon}
                </div>
                <div className="mt-1 text-center">
                  <p className="text-2xs font-medium truncate">{achievement.name}</p>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-2xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-dark-400">{achievement.description}</p>
                  {!isUnlocked && (
                    <p className="text-dark-500 mt-1">Not yet unlocked</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress by Act */}
      <div className="glass-card rounded-xl p-6 mb-8">
        <h2 className="font-semibold mb-4">Progress by Act</h2>
        <div className="space-y-4">
          {Object.entries(ACT_MAP).map(([aNum, aInfo]) => {
            const actNum = parseInt(aNum);
            const stats = actStats[actNum];
            const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            const quizPct = stats.quizTotal > 0 ? Math.round((stats.quizCorrect / stats.quizTotal) * 100) : null;
            const colors = ACT_COLORS[actNum];

            return (
              <div key={actNum} className="flex items-center gap-4">
                <div className={`w-24 shrink-0 px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                  {aInfo.label}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-2xs mb-1">
                    <span className="text-dark-400">{aInfo.name}</span>
                    <span>{stats.completed}/{stats.total} lectures</span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${colors.border.replace('border', 'bg')}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right shrink-0">
                  <span className="text-sm font-medium">{pct}%</span>
                </div>
                {quizPct !== null && (
                  <div className="w-20 text-right shrink-0 text-2xs text-dark-400">
                    Quiz: {quizPct}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column layout for smaller stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Flashcard Stats */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="font-semibold mb-4">Flashcard Progress</h2>
          {srsStats.total > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-2xs mb-1">
                    <span className="text-dark-400">Learning</span>
                    <span>{srsStats.learning}</span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(srsStats.learning / srsStats.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-2xs mb-1">
                    <span className="text-dark-400">Young</span>
                    <span>{srsStats.young}</span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-persian-500 rounded-full"
                      style={{ width: `${(srsStats.young / srsStats.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-2xs mb-1">
                    <span className="text-dark-400">Mature</span>
                    <span>{srsStats.mature}</span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-turquoise-500 rounded-full"
                      style={{ width: `${(srsStats.mature / srsStats.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-dark-700 text-2xs text-dark-400">
                Average ease factor: {srsStats.avgEaseFactor.toFixed(2)}
              </div>
            </div>
          ) : (
            <p className="text-dark-500 text-sm">
              No flashcards reviewed yet. <Link href="/review" className="text-persian-400 hover:underline">Start reviewing</Link>
            </p>
          )}
        </div>

        {/* Quiz Performance */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="font-semibold mb-4">Quiz Performance</h2>
          {Object.keys(quizScores).length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sections.map(sec => {
                const score = quizScores[sec.num];
                if (!score || score.total === 0) return null;
                const pct = Math.round((score.correct / score.total) * 100);
                return (
                  <div key={sec.num} className="flex items-center justify-between text-sm">
                    <span className="text-dark-400 truncate">{sec.num}. {sec.name}</span>
                    <span className={`font-medium ${
                      pct >= 80 ? 'text-turquoise-400' :
                      pct >= 60 ? 'text-saffron-400' :
                      'text-red-400'
                    }`}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-dark-500 text-sm">
              No quizzes taken yet. <Link href="/quiz" className="text-persian-400 hover:underline">Take a quiz</Link>
            </p>
          )}
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="font-semibold mb-4">Activity (Last 90 Days)</h2>
        <div className="overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-max gap-1" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
            {activityData.map((day, idx) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.count)}`}
                title={`${day.date}: ${day.count} lectures`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 text-2xs text-dark-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-dark-800" />
            <div className="w-3 h-3 rounded-sm bg-turquoise-900" />
            <div className="w-3 h-3 rounded-sm bg-turquoise-700" />
            <div className="w-3 h-3 rounded-sm bg-turquoise-500" />
            <div className="w-3 h-3 rounded-sm bg-turquoise-400" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Section-by-Section Breakdown */}
      <div className="glass-card rounded-xl p-6 mt-8">
        <h2 className="font-semibold mb-4">Section Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-2xs text-dark-400 border-b border-dark-700">
                <th className="pb-2">Section</th>
                <th className="pb-2 text-center">Progress</th>
                <th className="pb-2 text-center">Quiz</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(sec => {
                const completedInSec = sec.lectures.filter(l => completed[l.slug]).length;
                const pct = Math.round((completedInSec / sec.lectures.length) * 100);
                const score = quizScores[sec.num];
                const quizPct = score ? Math.round((score.correct / score.total) * 100) : null;
                const colors = ACT_COLORS[sec.actNum];

                return (
                  <tr key={sec.num} className="border-b border-dark-800/50">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${colors.border.replace('border', 'bg')}`} />
                        <Link href={`/lecture/${sec.lectures[0]?.slug}`} className="hover:text-persian-400">
                          {sec.num}. {sec.name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-2 text-center">
                      <span className={pct === 100 ? 'text-turquoise-400' : ''}>{pct}%</span>
                    </td>
                    <td className="py-2 text-center">
                      {quizPct !== null ? (
                        <span className={
                          quizPct >= 80 ? 'text-turquoise-400' :
                          quizPct >= 60 ? 'text-saffron-400' :
                          'text-red-400'
                        }>{quizPct}%</span>
                      ) : (
                        <span className="text-dark-600">-</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {pct === 100 ? (
                        <span className="px-2 py-0.5 bg-turquoise-500/20 text-turquoise-400 rounded text-2xs">Complete</span>
                      ) : pct > 0 ? (
                        <span className="px-2 py-0.5 bg-persian-500/20 text-persian-400 rounded text-2xs">In Progress</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-dark-700 text-dark-400 rounded text-2xs">Not Started</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
