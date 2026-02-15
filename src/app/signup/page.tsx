import { Metadata } from 'next';
import SignupClient from './SignupClient';

export const metadata: Metadata = {
  title: 'Sign Up - Rebuilding Iran',
  description: 'Create your account',
};

export default function SignupPage() {
  return <SignupClient />;
}
