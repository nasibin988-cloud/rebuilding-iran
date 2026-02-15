import { Suspense } from 'react';
import GroupsClient from './GroupsClient';

export const metadata = {
  title: 'Study Groups | Rebuilding Iran',
  description: 'Join study groups to learn together',
};

export default function GroupsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading groups...</div>}>
      <GroupsClient />
    </Suspense>
  );
}
