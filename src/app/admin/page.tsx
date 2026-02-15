import { Metadata } from 'next';
import AdminClient from './AdminClient';

export const metadata: Metadata = {
  title: 'Admin Panel - Rebuilding Iran',
  description: 'Administration and moderation tools',
};

export default function AdminPage() {
  return <AdminClient />;
}
