export type Language = 'en' | 'fa';
export type ActLabel = 'Act I' | 'Act II' | 'Act III' | 'Act IV';

export interface LectureMeta {
  slug: string;           // "001-001" (section-lecture)
  title: string;
  sectionNum: string;     // "001"
  sectionName: string;
  sectionId: string;      // "ORIGINS"
  lectureNum: string;     // "001"
  act: ActLabel;
  actNum: number;
  readingTime: number;
}

export interface Section {
  num: string;
  name: string;
  id: string;
  act: ActLabel;
  actNum: number;
  lectures: LectureMeta[];
}

export interface LectureFull extends LectureMeta {
  content: string;
  html: string;
}

export interface ProgressState {
  completed: Record<string, number>;
  notes: Record<string, string>;
  lastRead: string | null;
  dailyLog: Record<string, number>;
}

export const SECTION_MAP: Record<string, { name: string; id: string }> = {
  // Act I: The Story of Iran
  '001': { name: 'Origins', id: 'ORIGINS' },
  '002': { name: 'The First Empires', id: 'EMPIRES' },
  '003': { name: 'The Arab Conquest', id: 'CONQUEST' },
  '004': { name: 'The Persian Renaissance', id: 'RENAISSANCE' },
  '005': { name: 'Empire, Conversion, Awakening', id: 'TRANSFORMATION' },
  '006': { name: 'The Modern Era', id: 'MODERN' },
  '007': { name: 'The Revolution', id: 'REVOLUTION' },
  '008': { name: 'The Islamic Republic', id: 'REPUBLIC' },
  '009': { name: 'The Iranian Spirit', id: 'SPIRIT' },
  '010': { name: 'Iran Today and the Regime', id: 'TODAY' },
  // Act II: Philosophical Foundations
  '011': { name: 'Classical Political Philosophy', id: 'CLASSPHIL' },
  '012': { name: 'Ethics and Moral Reasoning', id: 'ETHICS' },
  '013': { name: 'Philosophy of Freedom', id: 'FREEDOM' },
  '014': { name: 'Critical Thinking', id: 'CRITTHINK' },
  '015': { name: 'Media Literacy', id: 'MEDIA' },
  '016': { name: 'Law, Rights, and Justice', id: 'LAW' },
  // Act III: The Science of Change
  '017': { name: 'Political Systems', id: 'POLSYSTEMS' },
  '018': { name: 'Governance and Statesmanship', id: 'STATECRAFT' },
  '019': { name: 'The Science of Revolution', id: 'REVSCI' },
  '020': { name: 'Successful Transitions', id: 'TRANSITIONS' },
  '021': { name: 'Failed Transitions', id: 'FAILURES' },
  '022': { name: 'How Economies Work', id: 'ECONOMICS' },
  '023': { name: "Iran's Economy", id: 'IRANECON' },
  '024': { name: 'Nation-Building Economics', id: 'NATIONBUILD' },
  '025': { name: 'Iran in Geopolitics', id: 'GEOPOLITICS' },
  '026': { name: 'The Diaspora', id: 'DIASPORA' },
  '027': { name: 'Civic Participation', id: 'CIVIC' },
  // Act IV: The Blueprint
  '028': { name: 'The Day After', id: 'DAYAFTER' },
  '029': { name: 'Building the New Iran', id: 'BUILDING' },
  '030': { name: 'The Long Game', id: 'LONGGAME' },
};

export const ACT_MAP: Record<number, { name: string; label: ActLabel; sectionNums: string[] }> = {
  1: { name: 'The Story of Iran', label: 'Act I', sectionNums: ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010'] },
  2: { name: 'Philosophical Foundations', label: 'Act II', sectionNums: ['011', '012', '013', '014', '015', '016'] },
  3: { name: 'The Science of Change', label: 'Act III', sectionNums: ['017', '018', '019', '020', '021', '022', '023', '024', '025', '026', '027'] },
  4: { name: 'The Blueprint', label: 'Act IV', sectionNums: ['028', '029', '030'] },
};

export function getActForSection(num: string): { act: ActLabel; actNum: number } {
  const n = parseInt(num, 10);
  if (n <= 10) return { act: 'Act I', actNum: 1 };
  if (n <= 16) return { act: 'Act II', actNum: 2 };
  if (n <= 27) return { act: 'Act III', actNum: 3 };
  return { act: 'Act IV', actNum: 4 };
}

/** Get all section numbers in display order (sequential 001-030) */
export function getSectionOrder(): string[] {
  const order: string[] = [];
  for (let a = 1; a <= 4; a++) {
    order.push(...ACT_MAP[a].sectionNums);
  }
  return order;
}
