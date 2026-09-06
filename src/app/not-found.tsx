import React from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="text-center space-y-4">
        <EmptyState
          icon="🔍"
          title="Page Not Found"
          description="The credential page or resource you requested does not exist on this CKB node explorer."
        />
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-lavender-spark text-midnight-plum rounded-lg hover:brightness-110 transition shadow-glow-sm"
        >
          Return to Registry Home
        </Link>
      </div>
    </div>
  );
}

