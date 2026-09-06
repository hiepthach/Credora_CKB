'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { formatCkbError } from '@/utils/errors';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App runtime error caught by error boundary:', error);
  }, [error]);

  const formatted = formatCkbError(error);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card variant="default" padding="xl" className="max-w-lg w-full text-center space-y-5 border-red-900/40 bg-midnight-plum/50">
        <div className="w-14 h-14 mx-auto bg-red-950/60 border border-red-800/60 rounded-2xl flex items-center justify-center text-red-400 shadow-glow-violet/20">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-bone-white tracking-tight">{formatted.title}</h2>
          <p className="text-sm text-ash-veil leading-relaxed">{formatted.message}</p>
          {error.digest && (
            <p className="text-[10px] font-mono text-mid-ash">Digest ID: {error.digest}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={() => reset()} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>
          <Link href="/">
            <Button size="sm" className="gap-1.5 text-xs">
              <Home className="w-3.5 h-3.5" />
              Return Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

