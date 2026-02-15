import { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'Profile - Rebuilding Iran',
  description: 'Manage your profile and settings',
};

export default function ProfilePage() {
  return <ProfileClient />;
}
