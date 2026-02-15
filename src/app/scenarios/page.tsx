import { Suspense } from 'react';
import ScenariosClient from './ScenariosClient';

export const metadata = {
  title: 'Scenario Assessments | Rebuilding Iran',
  description: 'Practice ethical decision-making through interactive scenarios',
};

export default function ScenariosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading scenarios...</div>}>
      <ScenariosClient />
    </Suspense>
  );
}
