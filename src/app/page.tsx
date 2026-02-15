import Link from 'next/link';
import { getSections } from '@/lib/content';
import { ACT_MAP } from '@/lib/types';
import HomeClient from '@/components/HomeClient';

const ACT_ICONS: Record<number, string> = {
  1: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  2: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  3: 'M13 10V3L4 14h7v7l9-11h-7z',
  4: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
};

const ACT_GRADIENTS: Record<number, string> = {
  1: 'from-turquoise-500 to-turquoise-700',
  2: 'from-persian-500 to-persian-700',
  3: 'from-saffron-500 to-saffron-700',
  4: 'from-amber-500 to-amber-700',
};

export default function HomePage() {
  const sections = getSections('en');
  const totalLectures = sections.reduce((sum, s) => sum + s.lectures.length, 0);

  const actGroups: Record<number, typeof sections> = {};
  for (const sec of sections) {
    if (!actGroups[sec.actNum]) actGroups[sec.actNum] = [];
    actGroups[sec.actNum].push(sec);
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-persian-900 via-persian-800 to-dark-950" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(45, 212, 191, 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(224, 160, 74, 0.3) 0%, transparent 50%)',
          }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-persian-500 to-turquoise-500 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">IR</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Rebuilding Iran</h1>
              <p className="text-persian-200 text-sm">The Statesman&apos;s Education</p>
            </div>
          </div>
          <p className="text-persian-100 max-w-2xl leading-relaxed mt-4">
            A comprehensive educational journey through Iran&apos;s origins, philosophy, governance, economics,
            and the blueprint for its future. From the Iranian plateau to the day after:
            empowering informed citizenship for Iran&apos;s transformation.
          </p>
          <div className="flex items-center gap-6 mt-8 text-sm">
            <div className="flex items-center gap-2 text-turquoise-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              {totalLectures} Lectures
            </div>
            <div className="flex items-center gap-2 text-saffron-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
              30 Sections
            </div>
            <div className="flex items-center gap-2 text-persian-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
              4 Acts
            </div>
          </div>
        </div>
      </div>

      {/* Acts Grid */}
      <HomeClient sections={sections} actGroups={actGroups} />
    </div>
  );
}
