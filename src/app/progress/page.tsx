import { getSections } from '@/lib/content';
import ProgressClient from './ProgressClient';

export const metadata = {
  title: 'Progress Dashboard - Rebuilding Iran',
  description: 'Track your learning progress across the curriculum',
};

export default function ProgressPage() {
  const sections = getSections('en');

  return <ProgressClient sections={sections} />;
}
