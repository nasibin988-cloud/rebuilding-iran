import { Metadata } from 'next';
import NewsClient from './NewsClient';

export const metadata: Metadata = {
  title: 'News - Rebuilding Iran',
  description: 'Latest news and analysis on Iran',
};

export default function NewsPage() {
  return <NewsClient />;
}
