import Link from 'next/link';
import { copy } from '@/lib/copy';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">{copy.preview.notFoundTitle}</h1>
        <p className="text-xl text-muted-foreground mb-6">{copy.preview.notFoundMessage}</p>
        <Link
          href="/brands"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 inline-block"
        >
          {copy.preview.backToBrands}
        </Link>
      </div>
    </div>
  );
}

