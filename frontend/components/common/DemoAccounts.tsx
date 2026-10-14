'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Mail, KeyRound } from 'lucide-react';
import { copy, formatCopy } from '@/lib/copy';

export type DemoAccount = {
  email: string;
  password: string;
  label: string;
};

const defaultAccounts: DemoAccount[] = [
  { email: 'admin@example.com', password: 'Admin123!', label: 'Admin' },
  { email: 'content@example.com', password: 'Content123!', label: 'Content' },
];

type DemoAccountsProps = {
  /** Demo accounts to display. Defaults to admin and content accounts. */
  accounts?: DemoAccount[];
};

/**
 * Renders a card listing demo credentials with per-field copy buttons (email / password).
 */
export function DemoAccounts({ accounts = defaultAccounts }: DemoAccountsProps) {
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(formatCopy(copy.common.copiedToClipboard, { label }));
    } catch {
      toast.error(copy.common.failedToCopy);
    }
  };

  return (
    <div className="mt-8 p-4 bg-muted/50 border border-border rounded-lg select-text">
      <p className="text-sm font-semibold text-foreground mb-2">{copy.common.demoAccounts}</p>
      <div className="space-y-2 text-xs text-muted-foreground">
        {accounts.map(({ email, password }) => (
          <div
            key={email}
            className="flex items-center justify-between gap-2"
          >
            <span className="font-mono truncate" title={`${email} / ${password}`}>
              {email} / {password}
            </span>
            <div className="flex shrink-0 gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-70 hover:opacity-100"
                onClick={() => copyToClipboard(email, 'Email')}
                title={copy.common.copyEmail}
              >
                <Mail className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-70 hover:opacity-100"
                onClick={() => copyToClipboard(password, 'Password')}
                title={copy.common.copyPassword}
              >
                <KeyRound className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
