import type { Metadata } from 'next';
import PageContent from './PageContent';

export const metadata: Metadata = { title: 'Media' };

export default function Page() {
  return <PageContent />;
}
