import { Metadata } from 'next';
import NewsEditorClient from './NewsEditorClient';

export const metadata: Metadata = {
  title: 'News Editor - Admin',
  description: 'Submit and manage news articles',
};

export default function NewsEditorPage() {
  return <NewsEditorClient />;
}
