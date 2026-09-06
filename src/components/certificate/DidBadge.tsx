'use client';

import { formatRecipientIdentifier } from '@/lib/did';

interface DidBadgeProps {
  id: string;
  className?: string;
}

export function DidBadge({ id, className = '' }: DidBadgeProps) {
  const { isDid, truncatedDid } = formatRecipientIdentifier(id);

  if (!isDid) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
        DID
      </span>
      <span className="text-xs text-mid-ash font-mono">
        {truncatedDid}
      </span>
    </div>
  );
}
