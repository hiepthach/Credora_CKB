'use client';

import { Card, Badge, Button } from '@/components/ui';
import type { CertificateDNA } from '@/types';
import { formatDate, truncateAddress } from '@/utils';
import { formatCertificateDisplay, isExpired } from '@/lib/credentials';
import { Award, Calendar, User, ExternalLink, ArrowRight } from 'lucide-react';
import { useNetwork } from '@/hooks';
import { DidBadge } from './DidBadge';

interface CertificateCardProps {
  certificate: CertificateDNA;
  certificateId: string;
  transactionHash?: string;
  onClick?: () => void;
  onShare?: () => void;
}

export function CertificateCard({
  certificate,
  certificateId,
  transactionHash,
  onClick,
  onShare,
}: CertificateCardProps) {
  const { explorerUrl } = useNetwork();
  const display = formatCertificateDisplay(certificate);
  const expired = isExpired(certificate);

  const getStatusBadge = () => {
    if (expired) return <Badge variant="warning">Expired</Badge>;
    return <Badge variant="success" pulse>Valid DOB</Badge>;
  };

  return (
    <Card
      variant="interactive"
      padding="lg"
      className="group flex flex-col justify-between"
      onClick={onClick}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-midnight-plum rounded-xl border border-lavender-spark/30 flex items-center justify-center text-lavender-spark shadow-glow-sm group-hover:scale-105 transition-transform duration-200">
              <Award className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-bone-white tracking-tight line-clamp-1">{display.course}</h3>
              <p className="text-xs text-ash-veil">{display.issuer}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-ash-veil">
            <User className="w-3.5 h-3.5 text-mid-ash" />
            <span className="text-bone-white font-medium">{display.recipient}</span>
            <DidBadge id={certificate.credentialSubject.id || ''} />
          </div>
          <div className="flex items-center gap-2 text-xs text-mid-ash">
            <Calendar className="w-3.5 h-3.5" />
            <span>Completed {formatDate(display.date)}</span>
          </div>
        </div>

        {/* Certificate ID */}
        <div className="text-[11px] text-mid-ash font-mono truncate mb-4 p-2 bg-midnight-plum/60 rounded-lg border border-fog-line/10">
          ID: {truncateAddress(certificateId, 8, 6)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-fog-line/10" onClick={(e) => e.stopPropagation()}>
        {explorerUrl && transactionHash && (
          <a
            href={`${explorerUrl}/transaction/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="ghost" size="sm" className="w-full text-xs gap-1 border border-fog-line/15">
              <ExternalLink className="w-3.5 h-3.5" />
              Explorer
            </Button>
          </a>
        )}
        <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={onShare}>
          Share
        </Button>
      </div>
    </Card>
  );
}

