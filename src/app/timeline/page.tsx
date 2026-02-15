'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  section: string;
  lecture?: string;
  era: 'ancient' | 'medieval' | 'early-modern' | 'modern' | 'contemporary';
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  // Origins (001)
  { year: '~7000 BCE', title: 'First Settlements on Iranian Plateau', description: 'Early agricultural communities emerge in western Iran', section: '001', era: 'ancient' },
  { year: '~3200 BCE', title: 'Proto-Elamite Civilization', description: 'First urban civilization in Iran, centered in Susa', section: '001', era: 'ancient' },
  { year: '~2700 BCE', title: 'Elamite Kingdom', description: 'Rise of the Elamite state in southwestern Iran', section: '001', era: 'ancient' },

  // First Empires (002)
  { year: '~678 BCE', title: 'Median Empire Founded', description: 'Deioces unites the Medes and establishes Ecbatana', section: '002', era: 'ancient' },
  { year: '550 BCE', title: 'Cyrus Founds Achaemenid Empire', description: 'Cyrus the Great defeats Astyages, uniting Persia and Media', section: '002', era: 'ancient' },
  { year: '539 BCE', title: 'Conquest of Babylon', description: 'Cyrus captures Babylon and frees the Jews', section: '002', era: 'ancient' },
  { year: '522 BCE', title: 'Darius I Takes Power', description: 'Darius consolidates the empire and introduces administrative reforms', section: '002', era: 'ancient' },
  { year: '490-479 BCE', title: 'Persian-Greek Wars', description: 'Marathon, Thermopylae, Salamis, and Plataea', section: '002', era: 'ancient' },
  { year: '330 BCE', title: 'Alexander Conquers Persia', description: 'Fall of the Achaemenid Empire to Macedon', section: '002', era: 'ancient' },
  { year: '247 BCE', title: 'Parthian Empire Founded', description: 'Arsaces I establishes the Arsacid dynasty', section: '002', era: 'ancient' },
  { year: '224 CE', title: 'Sassanid Empire Founded', description: 'Ardashir I defeats the Parthians, begins last pre-Islamic dynasty', section: '002', era: 'ancient' },

  // Arab Conquest (003)
  { year: '636 CE', title: 'Battle of Qadisiyya', description: 'Arab forces defeat the Sassanid army', section: '003', era: 'medieval' },
  { year: '651 CE', title: 'Fall of Sassanid Empire', description: 'Death of Yazdegerd III, end of pre-Islamic Iran', section: '003', era: 'medieval' },
  { year: '680 CE', title: 'Battle of Karbala', description: 'Martyrdom of Husayn, pivotal for Shia Islam', section: '003', era: 'medieval' },

  // Persian Renaissance (004)
  { year: '819 CE', title: 'Tahirid Dynasty', description: 'First autonomous Persian dynasty under the Caliphate', section: '004', era: 'medieval' },
  { year: '934 CE', title: 'Buyid Dynasty Controls Baghdad', description: 'Persian Shia dynasty dominates the Abbasid Caliphate', section: '004', era: 'medieval' },
  { year: '~1000 CE', title: 'Ferdowsi Completes Shahnameh', description: 'The Persian national epic preserves pre-Islamic heritage', section: '004', era: 'medieval' },
  { year: '1037 CE', title: 'Avicenna Dies', description: 'Death of the great philosopher and physician Ibn Sina', section: '004', era: 'medieval' },

  // Empire, Conversion, Awakening (005)
  { year: '1219 CE', title: 'Mongol Invasion Begins', description: 'Genghis Khan invades Greater Iran', section: '005', era: 'medieval' },
  { year: '1501 CE', title: 'Safavid Dynasty Founded', description: 'Shah Ismail I establishes Twelver Shia as state religion', section: '005', era: 'early-modern' },
  { year: '1722 CE', title: 'Afghan Invasion', description: 'Fall of Isfahan, end of Safavid golden age', section: '005', era: 'early-modern' },
  { year: '1796 CE', title: 'Qajar Dynasty Established', description: 'Agha Mohammad Khan founds the Qajar dynasty', section: '005', era: 'early-modern' },

  // Modern Era (006)
  { year: '1813-1828', title: 'Treaties of Gulistan and Turkmenchay', description: 'Iran loses Caucasus territories to Russia', section: '006', era: 'modern' },
  { year: '1906', title: 'Constitutional Revolution', description: 'First parliament (Majles) established, constitution adopted', section: '006', era: 'modern' },
  { year: '1925', title: 'Pahlavi Dynasty Founded', description: 'Reza Khan becomes Shah, beginning modernization drive', section: '006', era: 'modern' },
  { year: '1941', title: 'Anglo-Soviet Invasion', description: 'Reza Shah abdicates in favor of Mohammad Reza', section: '006', era: 'modern' },
  { year: '1953', title: 'Operation Ajax', description: 'CIA-MI6 coup overthrows Prime Minister Mosaddegh', section: '006', era: 'modern' },
  { year: '1963', title: 'White Revolution', description: 'Shah launches modernization and land reform', section: '006', era: 'modern' },

  // Revolution (007)
  { year: '1978', title: 'Revolutionary Protests Begin', description: 'Mass demonstrations against the Shah spread nationwide', section: '007', era: 'contemporary' },
  { year: 'Jan 1979', title: 'Shah Leaves Iran', description: 'Mohammad Reza Shah departs, never to return', section: '007', era: 'contemporary' },
  { year: 'Feb 1979', title: 'Khomeini Returns', description: 'Ayatollah Khomeini arrives from exile', section: '007', era: 'contemporary' },
  { year: 'Apr 1979', title: 'Islamic Republic Declared', description: 'Referendum establishes the Islamic Republic', section: '007', era: 'contemporary' },
  { year: 'Nov 1979', title: 'US Embassy Hostage Crisis', description: '444-day hostage crisis begins', section: '007', era: 'contemporary' },

  // Islamic Republic (008)
  { year: '1980-1988', title: 'Iran-Iraq War', description: 'Eight-year war with over one million casualties', section: '008', era: 'contemporary' },
  { year: '1989', title: 'Khomeini Dies', description: 'Death of the founder; Khamenei becomes Supreme Leader', section: '008', era: 'contemporary' },
  { year: '1997-2005', title: 'Khatami Presidency', description: 'Reform era and "Dialogue of Civilizations"', section: '008', era: 'contemporary' },
  { year: '2009', title: 'Green Movement', description: 'Mass protests over disputed election results', section: '008', era: 'contemporary' },
  { year: '2015', title: 'JCPOA Signed', description: 'Nuclear deal with world powers', section: '008', era: 'contemporary' },
  { year: '2022', title: 'Woman, Life, Freedom Movement', description: 'Nationwide protests following Mahsa Amini\'s death', section: '008', era: 'contemporary' },
];

const ERA_COLORS = {
  ancient: 'border-turquoise-500 bg-turquoise-500/10',
  medieval: 'border-persian-500 bg-persian-500/10',
  'early-modern': 'border-saffron-500 bg-saffron-500/10',
  modern: 'border-amber-500 bg-amber-500/10',
  contemporary: 'border-red-500 bg-red-500/10',
};

const ERA_LABELS = {
  ancient: 'Ancient',
  medieval: 'Medieval',
  'early-modern': 'Early Modern',
  modern: 'Modern',
  contemporary: 'Contemporary',
};

export default function TimelinePage() {
  const [selectedEra, setSelectedEra] = useState<string>('all');

  const filteredEvents = selectedEra === 'all'
    ? TIMELINE_EVENTS
    : TIMELINE_EVENTS.filter(e => e.era === selectedEra);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Timeline of Iranian History</h1>
          <p className="text-dark-400">Key events from {TIMELINE_EVENTS[0].year} to {TIMELINE_EVENTS[TIMELINE_EVENTS.length - 1].year}</p>
        </div>
        <Link href="/" className="text-sm text-dark-400 hover:text-persian-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </Link>
      </div>

      {/* Era Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedEra('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedEra === 'all' ? 'bg-persian-600 text-white' : 'bg-dark-800 hover:bg-dark-700'
          }`}
        >
          All Eras
        </button>
        {Object.entries(ERA_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedEra(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedEra === key ? 'bg-persian-600 text-white' : 'bg-dark-800 hover:bg-dark-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 sm:left-24 top-0 bottom-0 w-0.5 bg-dark-700" />

        <div className="space-y-6">
          {filteredEvents.map((event, idx) => (
            <div key={idx} className="relative flex gap-4 sm:gap-8">
              {/* Year */}
              <div className="w-16 sm:w-20 shrink-0 text-right">
                <span className="text-xs sm:text-sm font-mono text-dark-400">{event.year}</span>
              </div>

              {/* Dot */}
              <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 border-2 ${ERA_COLORS[event.era].split(' ')[0]} bg-dark-950 z-10`} />

              {/* Content */}
              <div className={`flex-1 p-4 rounded-xl border-l-4 ${ERA_COLORS[event.era]}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{event.title}</h3>
                  <span className="text-2xs px-2 py-0.5 rounded bg-dark-800 text-dark-400 shrink-0">
                    {ERA_LABELS[event.era]}
                  </span>
                </div>
                <p className="text-sm text-dark-400 mt-1">{event.description}</p>
                <Link
                  href={`/lecture/${event.section}-001`}
                  className="inline-block text-2xs text-persian-400 hover:underline mt-2"
                >
                  Section {event.section} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
