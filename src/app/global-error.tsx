'use client';

import React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-midnight text-bone-white min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-red-800/40 bg-midnight-plum">
          <h2 className="text-xl font-bold text-bone-white">System Error</h2>
          <p className="text-sm text-ash-veil">
            A critical application error occurred. Please reload the page to restore service.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 text-xs font-semibold bg-lavender-spark text-midnight-plum rounded-lg hover:brightness-110 transition"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}

