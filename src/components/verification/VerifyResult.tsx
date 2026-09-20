'use client';

import { Card, Badge, Button } from '@/components/ui';
import type { VerificationResult } from '@/types';
import { formatDate, truncateAddress } from '@/utils';
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink, Award, ArrowRight } from 'lucide-react';
import { useNetwork } from '@/hooks';

interface VerifyResultProps {
  result: VerificationResult;
  onViewDetails?: () => void;
}

export function VerifyResult({ result, onViewDetails }: VerifyResultProps) {
  const { explorerUrl } = useNetwork();

  if (result.valid && !result.certificate.isExpired) {
    return (
      <ValidResult result={result} onViewDetails={onViewDetails} />
    );
  }

  if (result.certificate.isExpired) {
    return (
      <ExpiredResult result={result} />
    );
  }

  return (
    <InvalidResult result={result} />
  );
}

function ValidResult({
  result,
  onViewDetails,
}: {
  result: VerificationResult;
  onViewDetails?: () => void;
}) {
  return (
    <Card variant="highlighted" padding="xl" className="border-signal-green/40 shadow-glow-green/20 animate-fade-in-scale">
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-midnight-plum border border-signal-green/40 rounded-2xl flex items-center justify-center text-signal-green shadow-glow-green/30 animate-float">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-bold text-bone-white mb-1.5 tracking-tight">
          Authentic & Valid DOB Credential
        </h2>
        <p className="text-ash-veil text-xs max-w-sm mx-auto">
          Cryptographically verified on Nervos CKB layer-1. Zero tampering detected.
        </p>
      </div>

      <div className="space-y-3 mt-4 pt-5 border-t border-fog-line/10 text-xs">
        <div className="flex justify-between items-center p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
          <span className="text-mid-ash uppercase tracking-wider font-semibold">Certificate ID</span>
          <span className="font-mono text-bone-white">
            {truncateAddress(result.certificateId, 10, 8)}
          </span>
        </div>
        <div className="flex justify-between items-center p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
          <span className="text-mid-ash uppercase tracking-wider font-semibold">Issuer Authority</span>
          <span className="text-bone-white font-medium">{result.issuer.name}</span>
        </div>
        <div className="flex justify-between items-center p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
          <span className="text-mid-ash uppercase tracking-wider font-semibold">Minted Date</span>
          <span className="text-bone-white">
            {formatDate(result.certificate.issuanceDate)}
          </span>
        </div>
        <div className="flex justify-between items-center p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
          <span className="text-mid-ash uppercase tracking-wider font-semibold">On-Chain State</span>
          <Badge variant="success" pulse>Active & Valid</Badge>
        </div>
      </div>

      {onViewDetails && (
        <Button className="w-full mt-6 text-xs gap-1.5 shadow-glow-green/30" onClick={onViewDetails}>
          <Award className="w-4 h-4" />
          <span>View Visual Certificate & Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      )}
    </Card>
  );
}

function ExpiredResult({ result }: { result: VerificationResult }) {
  return (
    <Card variant="default" padding="xl" className="border-amber-500/30 dark:border-yellow-500/40 animate-fade-in-scale">
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-midnight-plum border border-amber-500/30 dark:border-yellow-500/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-yellow-400 shadow-glow-sm animate-float">
          <AlertTriangle className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-bold text-amber-800 dark:text-yellow-400 mb-1.5 tracking-tight">
          Expired Credential
        </h2>
        <p className="text-ash-veil text-xs max-w-sm mx-auto">
          This credential was authentic but has passed its expiration date.
        </p>
      </div>

      <div className="space-y-3 mt-4 pt-5 border-t border-fog-line/10 text-xs">
        <div className="flex justify-between items-center p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
          <span className="text-mid-ash uppercase tracking-wider font-semibold">Certificate ID</span>
          <span className="font-mono text-bone-white">
            {truncateAddress(result.certificateId, 10, 8)}
          </span>
        </div>
        <div className="flex justify-between items-center p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
          <span className="text-mid-ash uppercase tracking-wider font-semibold">Issuer Authority</span>
          <span className="text-bone-white">{result.issuer.name}</span>
        </div>
        {result.certificate.expirationDate && (
          <div className="flex justify-between items-center p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
            <span className="text-mid-ash uppercase tracking-wider font-semibold">Expired On</span>
            <span className="text-amber-700 dark:text-yellow-400 font-medium">
              {formatDate(result.certificate.expirationDate)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
          <span className="text-mid-ash uppercase tracking-wider font-semibold">Status</span>
          <Badge variant="warning">Expired</Badge>
        </div>
      </div>
    </Card>
  );
}

function InvalidResult({ result }: { result: VerificationResult }) {
  return (
    <Card variant="default" padding="xl" className="border-red-500/30 dark:border-red-500/40 animate-fade-in-scale">
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-midnight-plum border border-red-500/30 dark:border-red-500/40 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 shadow-glow-sm animate-float">
          <XCircle className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-1.5 tracking-tight">
          Invalid Credential
        </h2>
        <p className="text-ash-veil text-xs max-w-sm mx-auto">
          {result.errors?.join('. ') || 'This certificate could not be verified on the blockchain'}
        </p>
      </div>

      {result.errors && result.errors.length > 0 && (
        <div className="mt-4 pt-5 border-t border-fog-line/10">
          <h3 className="text-xs font-semibold text-mid-ash uppercase tracking-wider mb-2">Errors</h3>
          <ul className="space-y-1 text-xs text-red-700 dark:text-red-400">
            {result.errors.map((error, index) => (
              <li key={index}>
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

