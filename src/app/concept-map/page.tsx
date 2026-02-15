import { getAllLectures, getSections } from '@/lib/content';
import ConceptMapClient from './ConceptMapClient';

export const metadata = {
  title: 'Concept Map | Rebuilding Iran',
  description: 'Visual map of curriculum concepts and their connections',
};

export default function ConceptMapPage() {
  const sections = getSections('en');
  const allLectures = getAllLectures('en');

  return <ConceptMapClient sections={sections} lectures={allLectures} />;
}
