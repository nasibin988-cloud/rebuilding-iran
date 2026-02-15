'use client';

import Link from 'next/link';
import { Section, ACT_MAP } from '@/lib/types';
import { useProgress } from './Providers';

const ACT_GRADIENTS: Record<number, string> = {
  1: 'from-turquoise-500/20 to-turquoise-600/5',
  2: 'from-persian-500/20 to-persian-600/5',
  3: 'from-saffron-500/20 to-saffron-600/5',
  4: 'from-amber-500/20 to-amber-600/5',
};

const ACT_BORDER: Record<number, string> = {
  1: 'border-turquoise-500/30',
  2: 'border-persian-500/30',
  3: 'border-saffron-500/30',
  4: 'border-amber-500/30',
};

const ACT_TEXT: Record<number, string> = {
  1: 'text-turquoise-600 dark:text-turquoise-400',
  2: 'text-persian-600 dark:text-persian-400',
  3: 'text-saffron-600 dark:text-saffron-400',
  4: 'text-amber-600 dark:text-amber-400',
};

interface Props {
  sections: Section[];
  actGroups: Record<number, Section[]>;
}

export default function HomeClient({ sections, actGroups }: Props) {
  const { isCompleted, completedCount, state } = useProgress();
  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-persian-600 dark:text-persian-400">{completedCount}</div>
          <div className="text-xs text-dark-500 dark:text-dark-400 mt-1">Completed</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-turquoise-600 dark:text-turquoise-400">
            {totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0}%
          </div>
          <div className="text-xs text-dark-500 dark:text-dark-400 mt-1">Progress</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-saffron-600 dark:text-saffron-400">
            {state.lastRead ? (
              <Link href={`/lecture/${state.lastRead}`} className="hover:underline">Resume</Link>
            ) : '-'}
          </div>
          <div className="text-xs text-dark-500 dark:text-dark-400 mt-1">Last Read</div>
        </div>
      </div>

      {/* Act Cards */}
      <div className="space-y-6">
        {Object.entries(ACT_MAP).map(([aNum, aInfo]) => {
          const actNum = parseInt(aNum);
          const actSections = actGroups[actNum] || [];
          const completedInAct = actSections.reduce(
            (sum, s) => sum + s.lectures.filter(l => isCompleted(l.slug)).length, 0
          );
          const totalInAct = actSections.reduce((sum, s) => sum + s.lectures.length, 0);
          const pct = totalInAct > 0 ? Math.round((completedInAct / totalInAct) * 100) : 0;

          return (
            <div
              key={actNum}
              className={`glass-card rounded-xl overflow-hidden border ${ACT_BORDER[actNum]}`}
            >
              <div className={`bg-gradient-to-r ${ACT_GRADIENTS[actNum]} px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${ACT_TEXT[actNum]}`}>
                      {aInfo.label}
                    </span>
                    <h2 className="text-lg font-bold mt-0.5">{aInfo.name}</h2>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${ACT_TEXT[actNum]}`}>{pct}%</div>
                    <div className="text-2xs text-dark-500 dark:text-dark-400">{completedInAct}/{totalInAct}</div>
                  </div>
                </div>
                <div className="h-1 bg-dark-200/30 dark:bg-dark-700/50 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${ACT_GRADIENTS[actNum].replace('/20', '').replace('/5', '')} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="px-6 py-4 grid gap-2">
                {actSections.map(sec => {
                  const secCompleted = sec.lectures.filter(l => isCompleted(l.slug)).length;
                  const firstLecture = sec.lectures[0];
                  return (
                    <Link
                      key={sec.num}
                      href={firstLecture ? `/lecture/${firstLecture.slug}` : '#'}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800/40 transition-colors group"
                    >
                      <span className={`text-xs font-mono font-bold ${ACT_TEXT[actNum]} opacity-60`}>
                        {sec.num}
                      </span>
                      <span className="flex-1 text-sm font-medium group-hover:text-persian-600 dark:group-hover:text-persian-400 transition-colors">
                        {sec.name}
                      </span>
                      <span className="text-2xs text-dark-400">
                        {secCompleted}/{sec.lectures.length}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
