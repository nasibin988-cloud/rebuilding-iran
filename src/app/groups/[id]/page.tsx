import { Suspense } from 'react';
import GroupDetailClient from './GroupDetailClient';

export const metadata = {
  title: 'Study Group | Rebuilding Iran',
  description: 'Study group discussion',
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading group...</div>}>
      <GroupDetailClient groupId={id} />
    </Suspense>
  );
}
