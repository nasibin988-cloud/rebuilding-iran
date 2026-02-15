import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ScenarioPlayerClient from './ScenarioPlayerClient';
import { getScenarioById, SCENARIOS } from '@/lib/scenarios';

export async function generateStaticParams() {
  return SCENARIOS.map(scenario => ({
    id: scenario.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = getScenarioById(id);
  if (!scenario) return { title: 'Scenario Not Found' };

  return {
    title: `${scenario.title} | Rebuilding Iran`,
    description: scenario.description,
  };
}

export default async function ScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = getScenarioById(id);

  if (!scenario) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading scenario...</div>}>
      <ScenarioPlayerClient scenario={scenario} />
    </Suspense>
  );
}
