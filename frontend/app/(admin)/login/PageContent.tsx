'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Layers, ArrowRight } from 'lucide-react';
import { DemoAccounts } from '@/components/common/DemoAccounts';
import { copy } from '@/lib/copy';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('redirect') ?? '/brands';
  const signInWithMosUrl = `/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
  // Build-time constant: both env vars are inlined by Next.js and never change at runtime.
  const isMosEnabled = Boolean(
    process.env.NEXT_PUBLIC_MOS_GATEWAY_URL && process.env.NEXT_PUBLIC_MOS_GATEWAY_CLIENT_ID
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(copy.login.toast.enterEmail);
      return;
    }
    if (!password) {
      toast.error(copy.login.toast.enterPassword);
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      setIsLoading(false);

      if (success) {
        toast.success(copy.login.toast.welcomeBack);
        router.replace('/brands');
        router.refresh();
      } else {
        toast.error(copy.login.toast.invalidCredentials);
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Login error:', error);
      toast.error(copy.login.toast.loginError);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-sidebar-foreground">{copy.login.appName}</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-bold text-sidebar-foreground leading-tight">
            {copy.login.tagline}<br />
            <span className="text-primary">{copy.login.taglineHighlight}</span>
          </h1>
          <p className="text-lg text-sidebar-muted max-w-md">
            {copy.login.intro}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div>
            <div className="text-3xl font-bold text-sidebar-foreground">18</div>
            <div className="text-sm text-sidebar-muted">{copy.login.statsBrands}</div>
          </div>
          <div className="w-px h-12 bg-sidebar-border" />
          <div>
            <div className="text-3xl font-bold text-sidebar-foreground">100+</div>
            <div className="text-sm text-sidebar-muted">{copy.login.statsWidgets}</div>
          </div>
          <div className="w-px h-12 bg-sidebar-border" />
          <div>
            <div className="text-3xl font-bold text-sidebar-foreground">∞</div>
            <div className="text-sm text-sidebar-muted">{copy.login.statsPossibilities}</div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Layers className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">{copy.login.appName}</span>
            </div>
            <h2 className="text-2xl font-bold">{copy.login.welcomeBack}</h2>
            <p className="text-muted-foreground">{copy.login.signInToAccount}</p>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-3xl font-bold mb-2">{copy.login.welcomeBack}</h2>
            <p className="text-muted-foreground">{copy.login.signInToContinue}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {copy.login.email}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={copy.login.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {copy.login.password}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={copy.login.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                copy.login.signingIn
              ) : (
                <>
                  {copy.login.signIn}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {isMosEnabled && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            )}
            {isMosEnabled && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                asChild
              >
                {/* prefetch=false: /signin is a route handler, not a page */}
                <Link prefetch={false} href={signInWithMosUrl as Route}>
                  Sign in with external provider
                </Link>
              </Button>
            )}
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>{copy.login.noAccount}</p>
          </div>

          <DemoAccounts />
        </div>
      </div>
    </div>
  );
}

export default function PageContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sidebar flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

