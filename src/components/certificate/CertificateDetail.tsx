'use client';

import { Modal, Card, Badge, Button, Input } from '@/components/ui';
import type { CertificateDNA, CertificateLayout, CertificateTheme } from '@/types';
import { formatDate, truncateAddress, copyToClipboard, cn } from '@/utils';
import { formatCertificateDisplay, isExpired } from '@/lib/credentials';
import { getTransactionUrl, getAddressUrl } from '@/lib/ckb';
import { isDidInput } from '@/lib/did';
import {
  Award,
  Calendar,
  User,
  Building,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Flame,
  Printer,
  Eye,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { useNetwork } from '@/hooks';
import { PaperCertificate } from './PaperCertificate';

interface CertificateDetailProps {
  certificate: CertificateDNA;
  certificateId: string;
  transactionHash?: string;
  isIssuer?: boolean;
  onCopyId?: () => void;
  onOpenExplorer?: () => void;
  onShare?: () => void;
  onMelt?: () => Promise<void> | void;
  melting?: boolean;
}

export function CertificateDetail({
  certificate,
  certificateId,
  transactionHash,
  isIssuer = false,
  onOpenExplorer,
  onShare,
  onMelt,
  melting = false,
}: CertificateDetailProps) {
  const { explorerUrl } = useNetwork();
  const [viewMode, setViewMode] = useState<'visual' | 'technical'>('visual');
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showMeltModal, setShowMeltModal] = useState(false);
  const [meltReason, setMeltReason] = useState('');
  const [meltModalError, setMeltModalError] = useState<string | null>(null);

  const display = formatCertificateDisplay(certificate);
  const expired = isExpired(certificate);
  const subject = certificate.credentialSubject || { type: 'CourseCertificate' };
  const metadata = subject.metadata;

  const isRecipientDid = Boolean(
    subject.id && (subject.id.startsWith('did:') || isDidInput(subject.id))
  );
  const recipientAddress = !isRecipientDid
    ? (subject.id || subject.walletAddress)
    : subject.walletAddress;

  const handleCopyField = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const initialLayout: CertificateLayout =
    (metadata?.layout as CertificateLayout) || 'classic';
  const initialTheme: CertificateTheme =
    (metadata?.theme as CertificateTheme) || 'blue';
  const initialCustomColor: string | undefined =
    typeof metadata?.customColor === 'string' ? metadata.customColor : undefined;
  const initialCustomTitle: string | undefined =
    typeof metadata?.customTitle === 'string' ? metadata.customTitle : undefined;

  const handleCopyId = async () => {
    const success = await copyToClipboard(certificateId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    if (expired) return <Badge variant="warning">Expired</Badge>;
    return <Badge variant="success" pulse>Verified On-Chain DOB</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation Bar: View Toggle & Print Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-fog-line/10 no-print">
        <div className="flex bg-midnight-plum p-1 rounded-xl border border-fog-line/10 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('visual')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
              viewMode === 'visual'
                ? 'bg-shadow-plum text-bone-white shadow-sm border border-fog-line/20'
                : 'text-mid-ash hover:text-bone-white'
            )}
          >
            <Eye className="w-3.5 h-3.5 text-lavender-spark" />
            <span>Visual Certificate</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('technical')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5',
              viewMode === 'technical'
                ? 'bg-shadow-plum text-bone-white shadow-sm border border-fog-line/20'
                : 'text-mid-ash hover:text-bone-white'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-signal-green" />
            <span>On-Chain Proof</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 border border-lavender-spark/30 text-bone-white hover:bg-lavender-spark/10"
          >
            <Printer className="w-3.5 h-3.5 text-lavender-spark" />
            <span>Print / Save PDF</span>
          </Button>
        </div>
      </div>

      {/* Visual Mode: Paper Certificate (Always available for print media) */}
      <div className={cn('space-y-4', viewMode !== 'visual' && 'hidden print:block')}>
        {/* Render Paper Certificate */}
        <div className="p-1 sm:p-2 bg-midnight-plum/40 rounded-2xl border border-fog-line/10 shadow-glow-sm print:p-0 print:border-none print:bg-transparent print:shadow-none">
          <PaperCertificate
            certificate={certificate}
            certificateId={certificateId}
            layout={initialLayout}
            theme={initialTheme}
            customColor={initialCustomColor}
            customTitle={initialCustomTitle}
            isExpired={expired}
          />
        </div>

        {/* Visual Mode Actions */}
        <div className="flex flex-wrap gap-3 pt-2 no-print">
          {transactionHash && (
            <a
              href={getTransactionUrl(transactionHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[140px]"
            >
              <Button variant="secondary" className="w-full text-xs gap-1.5 shadow-glow-violet/20">
                <ExternalLink className="w-3.5 h-3.5" />
                View on CKB Explorer
              </Button>
            </a>
          )}
          {onShare && (
            <Button variant="secondary" className="flex-1 min-w-[140px] text-xs" onClick={onShare}>
              Share Certificate
            </Button>
          )}
          {!expired && onMelt && (
            <Button
              variant="secondary"
              className="flex-1 min-w-[140px] text-xs gap-1.5 border border-orange-500/40 text-orange-400 hover:bg-orange-950/30"
              onClick={() => {
                setMeltModalError(null);
                setShowMeltModal(true);
              }}
              disabled={melting}
            >
              <Flame className="w-3.5 h-3.5" />
              Melt & Reclaim CKB
            </Button>
          )}
        </div>
      </div>

      {/* Technical Mode: On-Chain Cryptographic Proof and DOB Cards */}
      {viewMode === 'technical' && (
        <div className="space-y-6 no-print">
          {/* Certificate Header Display */}
          <div className="text-center py-10 px-6 bg-shadow-plum rounded-2xl border border-fog-line/15 shadow-glow-violet relative overflow-hidden">
            <div className="w-20 h-20 mx-auto mb-4 bg-midnight-plum border border-lavender-spark/30 rounded-2xl flex items-center justify-center shadow-glow-violet text-lavender-spark animate-float">
              <Award className="w-10 h-10" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-bone-white mb-2 tracking-tight">
              Certificate of Completion
            </h1>
            <p className="text-xl text-lavender-spark font-semibold mb-4">{display.course}</p>
            <div className="flex justify-center">
              {getStatusBadge()}
            </div>
          </div>

          {/* Recipient Info */}
          <Card variant="default" padding="lg">
            <h2 className="text-base font-semibold text-bone-white mb-4 tracking-tight">Recipient Profile</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-mid-ash" />
                <span className="text-bone-white font-medium">{display.recipient}</span>
              </div>
              {isRecipientDid && (
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 flex items-center justify-center text-xs text-mid-ash flex-shrink-0">🔗</span>
                  <span className="text-mid-ash flex-shrink-0">DID:</span>
                  <span className="text-bone-white font-mono text-xs flex-1 truncate">{subject.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyField(subject.id || '', 'did')}
                    className="text-mid-ash hover:text-lavender-spark transition-colors flex-shrink-0"
                    title="Copy DID"
                  >
                    {copiedField === 'did' ? (
                      <Check className="w-3.5 h-3.5 text-signal-green" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
              {recipientAddress && (
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-mid-ash flex-shrink-0" />
                  <span className="text-mid-ash flex-shrink-0">Address:</span>
                  <a
                    href={explorerUrl ? `${explorerUrl}/address/${recipientAddress}` : getAddressUrl(recipientAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 flex items-center gap-1.5 text-bone-white hover:text-lavender-spark hover:underline font-mono text-xs group"
                    title="View on CKB Explorer"
                  >
                    <span className="truncate">{recipientAddress}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-mid-ash group-hover:text-lavender-spark transition-colors" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyField(recipientAddress, 'address')}
                    className="text-mid-ash hover:text-lavender-spark transition-colors flex-shrink-0"
                    title="Copy Address"
                  >
                    {copiedField === 'address' ? (
                      <Check className="w-3.5 h-3.5 text-signal-green" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
              {subject.grade && (
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 flex items-center justify-center text-xs text-mid-ash">🎓</span>
                  <span className="text-bone-white">Grade: <strong className="text-signal-green">{subject.grade}</strong></span>
                </div>
              )}
              {subject.score !== undefined && (
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 flex items-center justify-center text-xs text-mid-ash">📊</span>
                  <span className="text-bone-white">Score: <strong className="text-signal-green">{subject.score}%</strong></span>
                </div>
              )}
            </div>
          </Card>

          {/* Course Details */}
          <Card variant="default" padding="lg">
            <h2 className="text-base font-semibold text-bone-white mb-4 tracking-tight">Course & Issuer</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-mid-ash" />
                <span className="text-bone-white">{display.course}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-mid-ash" />
                <span className="text-bone-white">{display.issuer}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-mid-ash" />
                <span className="text-ash-veil">
                  Completed on {formatDate(subject.completionDate || certificate.issuanceDate)}
                </span>
              </div>
              {certificate.expirationDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-mid-ash" />
                  <span className="text-ash-veil">
                    Expires on {formatDate(certificate.expirationDate)}
                  </span>
                </div>
              )}
            </div>

            {/* Skills */}
            {subject.skills && subject.skills.length > 0 && (
              <div className="mt-5 pt-4 border-t border-fog-line/10">
                <h3 className="text-xs font-semibold text-mid-ash uppercase tracking-wider mb-2.5">Skills Certified</h3>
                <div className="flex flex-wrap gap-2">
                  {subject.skills.map((skill, index) => (
                    <Badge key={index} variant="lavender">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Certificate Metadata */}
          <Card variant="default" padding="lg">
            <h2 className="text-base font-semibold text-bone-white mb-4 tracking-tight">On-Chain Cryptographic Proof</h2>
            <div className="space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
                <span className="text-mid-ash uppercase tracking-wider font-medium">Certificate ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-bone-white">
                    {truncateAddress(certificateId, 12, 8)}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="p-1 text-ash-veil hover:text-bone-white transition-colors"
                    title="Copy ID"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-signal-green" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
                <span className="text-mid-ash uppercase tracking-wider font-medium">Issuer Cluster ID</span>
                <span className="font-mono text-bone-white">
                  {truncateAddress(certificate.issuer.id, 12, 8)}
                </span>
              </div>
              {transactionHash && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
                  <span className="text-mid-ash uppercase tracking-wider font-medium">Transaction Hash</span>
                  <a
                    href={getTransactionUrl(transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-lavender-spark hover:underline flex items-center gap-1"
                  >
                    {truncateAddress(transactionHash, 12, 8)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              <div className="flex justify-between items-center p-2.5 bg-midnight-plum rounded-xl border border-fog-line/10">
                <span className="text-mid-ash uppercase tracking-wider font-medium">Issued Date</span>
                <span className="text-bone-white">{formatDate(certificate.issuanceDate)}</span>
              </div>
            </div>
          </Card>

          {/* Technical Mode Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            {transactionHash && (
              <a
                href={getTransactionUrl(transactionHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px]"
              >
                <Button variant="secondary" className="w-full text-xs gap-1.5 shadow-glow-violet/20">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on CKB Explorer
                </Button>
              </a>
            )}
            {onShare && (
              <Button variant="secondary" className="flex-1 min-w-[140px] text-xs" onClick={onShare}>
                Share Certificate
              </Button>
            )}

            {!expired && onMelt && (
              <Button
                variant="secondary"
                className="flex-1 min-w-[140px] text-xs gap-1.5 border border-orange-500/40 text-orange-400 hover:bg-orange-950/30"
                onClick={() => {
                  setMeltModalError(null);
                  setShowMeltModal(true);
                }}
                disabled={melting}
              >
                <Flame className="w-3.5 h-3.5" />
                Melt & Reclaim CKB
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Melt Certificate Modal */}
      <Modal
        isOpen={showMeltModal}
        onClose={() => {
          setShowMeltModal(false);
          setMeltModalError(null);
        }}
        title="Melt Certificate & Reclaim CKB"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-orange-950/40 border border-orange-700/40 rounded-xl flex items-start gap-3">
            <Flame className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-200 leading-relaxed">
              This will <strong>permanently destroy</strong> the certificate DOB and return the locked CKB capacity to your wallet. This action cannot be undone.
            </p>
          </div>

          {meltModalError && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{meltModalError}</span>
            </div>
          )}

          <div className="p-3 bg-midnight-plum rounded-xl border border-fog-line/10 text-xs text-ash-veil space-y-2">
            <div className="flex justify-between">
              <span>Certificate ID</span>
              <span className="font-mono text-bone-white">{truncateAddress(certificateId, 12, 6)}</span>
            </div>
            <div className="flex justify-between">
              <span>Type</span>
              <span className="text-bone-white">Spore DOB Cell</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ash-veil">
              Reason for Melting (Optional)
            </label>
            <Input
              placeholder="e.g., No longer needed, recipient requested..."
              value={meltReason}
              onChange={(v) => setMeltReason(v)}
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-fog-line/10">
            <Button
              variant="secondary"
              onClick={() => {
                setShowMeltModal(false);
                setMeltModalError(null);
              }}
              className="flex-1 text-xs"
              disabled={melting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 text-xs bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg"
              loading={melting}
              onClick={async () => {
                if (!onMelt) return;
                try {
                  setMeltModalError(null);
                  await onMelt();
                  setShowMeltModal(false);
                } catch (err: any) {
                  setMeltModalError(err?.message || 'Failed to melt certificate');
                }
              }}
            >
              <Flame className="w-3.5 h-3.5" />
              Melt & Reclaim
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
