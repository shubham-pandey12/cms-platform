import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { plusJakartaSans } from './fonts';
import { copy } from '@/lib/copy';
import { getServerSession } from '@/lib/auth/serverSession';

export const metadata: Metadata = {
  title: { default: copy.app.title, template: '%s | CMS' },
  description: copy.app.description,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionFromServer = await getServerSession();
  return (
    <html lang="en" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body>
        <Providers sessionFromServer={sessionFromServer}>{children}</Providers>
      </body>
    </html>
  );
}
