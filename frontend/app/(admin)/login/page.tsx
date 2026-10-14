import type { Metadata } from 'next';
import PageContent from './PageContent';

export const metadata: Metadata = { title: 'Sign in' };

export default function Page() {
  return <PageContent />;
}
