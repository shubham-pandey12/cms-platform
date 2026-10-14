import type { Metadata } from 'next';
import PageContent from './PageContent';

export const metadata: Metadata = { title: 'Roles' };

export default function Page() {
  return <PageContent />;
}
