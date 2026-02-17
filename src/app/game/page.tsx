import { Metadata } from 'next';
import GameClient from './GameClient';

export const metadata: Metadata = {
  title: 'IRAN 14XX - Political Simulation',
  description: 'An educational political simulation game exploring possible futures for Iran.',
  keywords: ['Iran', 'political simulation', 'strategy game', 'education'],
};

export default function GamePage() {
  return <GameClient />;
}
