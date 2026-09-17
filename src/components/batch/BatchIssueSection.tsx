'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Badge } from '@/components/ui';
import { BatchUpload } from './BatchUpload';
import { BatchPreview } from './BatchPreview';
import { Upload, CheckCircle2, AlertTriangle, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';
import type { Cluster, BatchEntry, BatchIssueParams, BatchIssueResult, VisualStyleConfig } from '@/types';
import { previewBatch, validateBatchEntries, issueBatchCertificates } from '@/lib/credentials';
import { truncateAddress } from '@/utils';

function getBatchErrorHint(errorMessage?: string): { hint: string; link?: { label: string; href: string } } | null {
  if (!errorMessage) return null;
  const msg = errorMessage.toLowerCase();

  if (msg.includes('capacity') || msg.includes('balance') || msg.includes('faucet') || msg.includes('not enough')) {
    return {
      hint: 'Wallet has insufficient CKB capacity. Each certificate requires 400–1000 CKB depending on data size. Please deposit more CKB from the faucet.',
      link: {
        label: 'Get free testnet CKB from Faucet →',
        href: 'https://faucet.nervos.org',
      },
    };
  }
  if (msg.includes('user rejected') || msg.includes('cancelled') || msg.includes('closed') || msg.includes('denied')) {
    return {
      hint: 'Signing transaction was rejected or confirmation window was closed in your wallet (JoyID / MetaMask). Please try again and approve the transaction.',
    };
  }
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('fetch') || msg.includes('rpc') || msg.includes('node unavailable')) {
    return {
      hint: 'Network connection or CKB RPC node timed out or was interrupted. Please check your network and try again.',
    };
  }
  if (msg.includes('address') || msg.includes('lock script') || msg.includes('type script')) {
    return {
      hint: 'Recipient CKB address is invalid or uses an incompatible lock script. Please verify recipient addresses (must start with ckt/ckb).',
    };
  }
  if (msg.includes('duplicate') || msg.includes('already exists') || msg.includes('already been')) {
    return {
      hint: 'A certificate may already exist for this recipient address. Each recipient can only have one active certificate per cluster.',
    };
  }
  if (msg.includes('signature') || msg.includes('signing') || msg.includes('signer')) {
    return {
      hint: 'Wallet signing failed. Please reconnect your wallet (JoyID / MetaMask) and try again.',
    };
  }
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many request')) {
    return {
      hint: 'Too many requests sent to the RPC node. Please wait a moment and try again.',
    };
  }
  if (msg.includes('cluster') && (msg.includes('not found') || msg.includes('not exist') || msg.includes('does not exist'))) {
    return {
      hint: 'The issuer cluster was not found on-chain. It may have been deleted or the cluster ID is incorrect.',
    };
  }
  if (msg.includes('template') || msg.includes('layout') && (msg.includes('invalid') || msg.includes('not found'))) {
    return {
      hint: 'Certificate template or layout configuration is invalid. Please check the template settings.',
    };
  }
  if (msg.includes('expiration') || msg.includes('expiry') || msg.includes('expired')) {
    return {
      hint: 'Invalid or past expiration date. Please use a future date in YYYY-MM-DD format.',
    };
  }
  if (msg.includes('date') && (msg.includes('invalid') || msg.includes('format'))) {
    return {
      hint: 'Date format is invalid. Please use YYYY-MM-DD format (e.g., 2025-12-31).',
    };
  }
  return null;
}

function categorizeError(errorMessage?: string): string {
  if (!errorMessage) return 'unknown';
  const msg = errorMessage.toLowerCase();
  if (msg.includes('capacity') || msg.includes('balance') || msg.includes('faucet') || msg.includes('not enough')) return 'capacity';
  if (msg.includes('user rejected') || msg.includes('cancelled') || msg.includes('closed') || msg.includes('denied')) return 'wallet_rejected';
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('fetch') || msg.includes('rpc') || msg.includes('node unavailable')) return 'network';
  if (msg.includes('address') || msg.includes('lock script') || msg.includes('type script')) return 'address';
  if (msg.includes('duplicate') || msg.includes('already exists') || msg.includes('already been')) return 'duplicate';
  if (msg.includes('signature') || msg.includes('signing') || msg.includes('signer')) return 'signature';
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many request')) return 'rate_limit';
  if (msg.includes('cluster') && (msg.includes('not found') || msg.includes('not exist') || msg.includes('does not exist'))) return 'cluster';
  if (msg.includes('template') || msg.includes('layout')) return 'template';
  if (msg.includes('expiration') || msg.includes('expiry') || msg.includes('expired') || msg.includes('date')) return 'date';
  return 'other';
}

interface ErrorGroup {
  category: string;
  count: number;
  rows: number[];
  courseNames: (string | undefined)[];
  sampleError: string;
}

export type BatchStep = 'upload' | 'preview' | 'issuing' | 'result';

export interface BatchIssueSectionProps {
  clusterId: string;
  cluster: Cluster;
  signer: any;
  onNavigateToCertificates?: () => void;
}

export function BatchIssueSection({
  clusterId,
  cluster,
  signer,
  onNavigateToCertificates,
}: BatchIssueSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<BatchStep>('upload');
  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const [preview, setPreview] = useState<ReturnType<typeof previewBatch> | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<VisualStyleConfig | undefined>(undefined);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    currentAddress: string;
    status: 'encoding' | 'building' | 'signing' | 'sending';
  } | null>(null);
  const [result, setResult] = useState<BatchIssueResult | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    async function parseFile() {
      const { parseBatchFile, calculateBatchCapacity } = await import('@/lib/credentials');
      const { entries: parsedEntries } = await parseBatchFile(file);
      const validated = validateBatchEntries(parsedEntries);

      let finalEntries = validated.entries;
      let totalCap: number | undefined;

      if (clusterId) {
        try {
          const capRes = await calculateBatchCapacity(validated.entries, {
            clusterId,
            issuerName: cluster?.name,
            issuerDescription: cluster?.description,
            client: signer?.client,
          });
          finalEntries = capRes.entriesWithCapacity;
          totalCap = capRes.totalCapacity;
        } catch {
          // fallback to entries without calculated capacity
        }
      }

      setEntries(finalEntries);

      if (clusterId) {
        const previewData = previewBatch(finalEntries, clusterId);
        if (totalCap !== undefined) {
          previewData.exactTotalCapacity = totalCap;
          previewData.estimatedFee = `${totalCap.toLocaleString()} CKB`;
          previewData.estimatedTotalCapacity = `${totalCap.toLocaleString()} CKB`;
        }
        setPreview(previewData);
      }

      setStep('preview');
    }
    parseFile();
  }, [clusterId, cluster, signer]);

  const issueMutation = useMutation({
    mutationFn: async (styleConfig?: VisualStyleConfig) => {
      if (!signer || !clusterId || !cluster || !preview) {
        throw new Error('Missing required parameters for batch issuance');
      }

      const styleToUse = styleConfig ?? selectedStyle;

      const params: BatchIssueParams = {
        clusterId,
        issuerName: cluster.name,
        issuerDescription: cluster.description,
        entries: preview.validEntries,
        defaultStyle: styleToUse,
      };

      return issueBatchCertificates(signer, params, (p) => setProgress(p));
    },
    onSuccess: (data) => {
      setResult(data);
      setStep('result');
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
    },
  });

  const [copiedErrorLog, setCopiedErrorLog] = useState(false);

  const handleCopyErrors = () => {
    if (!result) return;
    const failedCerts = result.certificates.filter((c) => !c.success);
    const text = failedCerts
      .map(
        (c) =>
          `Row #${c.row} | ${c.recipientName || 'No Name'} | Address: ${c.recipientAddress} | Error: ${c.error || 'Unknown error'}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedErrorLog(true);
    setTimeout(() => setCopiedErrorLog(false), 2500);
  };

  const handleCancel = () => {
    setStep('upload');
    setEntries([]);
    setPreview(null);
    setSelectedStyle(undefined);
    setProgress(null);
    setResult(null);
    setCopiedErrorLog(false);
  };

  const handleViewCertificates = () => {
    if (onNavigateToCertificates) {
      onNavigateToCertificates();
    } else {
      router.push('/certificates');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Step */}
      {step === 'upload' && (
        <BatchUpload onFileSelect={handleFileSelect} />
      )}

      {/* Preview Step */}
      {step === 'preview' && preview && (
        <BatchPreview
          entries={entries}
          estimatedCost={preview.estimatedFee}
          exactTotalCapacity={preview.exactTotalCapacity}
          clusterId={clusterId}
          issuerName={cluster?.name}
          issuerDescription={cluster?.description}
          client={signer?.client}
          onConfirm={(defaultStyle) => {
            setSelectedStyle(defaultStyle);
            setStep('issuing');
            issueMutation.mutate(defaultStyle);
          }}
          onCancel={handleCancel}
          loading={issueMutation.isPending}
          progress={progress}
        />
      )}

      {/* Issuing Step */}
      {step === 'issuing' && (
        <Card variant="default" padding="xl" className="text-center">
          <div className="py-8 space-y-6">
            <div className="w-16 h-16 mx-auto bg-midnight-plum border border-lavender-spark/30 rounded-2xl flex items-center justify-center text-2xl shadow-glow-violet/30 animate-pulse">
              ⛏️
            </div>
            <div>
              <h2 className="text-xl font-bold text-bone-white tracking-tight mb-2">
                Issuing Certificates...
              </h2>
              <p className="text-sm text-ash-veil">
                Please wait while certificates are being minted to the blockchain.
              </p>
            </div>

            {progress && (
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-xs text-ash-veil mb-2">
                  <span>Progress</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="h-2 bg-midnight-plum rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lavender-spark transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <div className="mt-3 text-xs text-mid-ash font-mono">
                  {truncateAddress(progress.currentAddress, 10, 6)}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Result Step */}
      {step === 'result' && result && (
        <Card variant={result.failed === 0 ? 'highlighted' : 'default'} padding="xl">
          <div className="text-center py-6">
            {result.failed === 0 ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-signal-green/10 border border-signal-green/30 rounded-2xl flex items-center justify-center text-signal-green">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-xl font-bold text-bone-white tracking-tight">
                  All Certificates Issued Successfully!
                </h2>
                <p className="text-sm text-ash-veil mt-1">
                  {result.successful} certificates have been minted to the blockchain.
                </p>
              </>
            ) : result.successful === 0 ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-9 h-9" />
                </div>
                <h2 className="text-xl font-bold text-bone-white tracking-tight">
                  Issuance Failed
                </h2>
                <p className="text-sm text-ash-veil mt-1">
                  All {result.total} certificates failed to issue. Review the detailed error reasons below to correct your data.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center justify-center text-yellow-400">
                  <AlertTriangle className="w-9 h-9" />
                </div>
                <h2 className="text-xl font-bold text-bone-white tracking-tight">
                  Partially Completed
                </h2>
                <p className="text-sm text-ash-veil mt-1">
                  {result.successful} succeeded, {result.failed} failed. Review the failed certificates below to make corrections.
                </p>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 p-4 bg-midnight-plum rounded-xl border border-fog-line/10 text-center">
              <div className="text-2xl font-bold text-signal-green">{result.successful}</div>
              <div className="text-xs text-mid-ash uppercase tracking-wider">Successful</div>
            </div>
            <div className="flex-1 p-4 bg-midnight-plum rounded-xl border border-fog-line/10 text-center">
              <div className="text-2xl font-bold text-red-400">{result.failed}</div>
              <div className="text-xs text-mid-ash uppercase tracking-wider">Failed</div>
            </div>
          </div>

          {/* Error Grouping Summary */}
          {result.failed > 0 && (() => {
            const failedCerts = result.certificates.filter(c => !c.success);
            const groups: Record<string, ErrorGroup> = {};
            failedCerts.forEach(cert => {
              const key = categorizeError(cert.error);
              if (!groups[key]) {
                groups[key] = {
                  category: key,
                  count: 0,
                  rows: [],
                  courseNames: [],
                  sampleError: cert.error || 'Issuance failed',
                };
              }
              groups[key].count++;
              groups[key].rows.push(cert.row);
              if (cert.courseName) groups[key].courseNames.push(cert.courseName);
            });

            const sortedGroups = Object.values(groups).sort((a, b) => b.count - a.count);

            return (
              <div className="mb-6 p-4 rounded-xl bg-midnight-plum/50 border border-fog-line/10">
                <div className="text-xs font-semibold text-mid-ash uppercase tracking-wider mb-3">
                  Error Summary — {result.failed} failed ({sortedGroups.length} error type{sortedGroups.length > 1 ? 's' : ''})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sortedGroups.map(group => {
                    const hintObj = getBatchErrorHint(group.sampleError);
                    const categoryLabels: Record<string, string> = {
                      capacity: 'Insufficient CKB Balance',
                      wallet_rejected: 'Wallet Rejected Signing',
                      network: 'Network / RPC Error',
                      address: 'Invalid Address',
                      duplicate: 'Certificate Already Exists',
                      signature: 'Signature Error',
                      rate_limit: 'Rate Limit',
                      cluster: 'Cluster Not Found',
                      template: 'Template Error',
                      date: 'Invalid Date',
                      other: 'Other Error',
                    };
                    return (
                      <div key={group.category} className="p-3 bg-midnight-plum rounded-lg border border-fog-line/10">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-red-400">
                            {categoryLabels[group.category] || group.category}
                          </span>
                          <span className="text-xs text-mid-ash font-mono bg-red-500/10 px-2 py-0.5 rounded-full">
                            {group.count}× {group.count === 1 ? 'row' : 'rows'}
                          </span>
                        </div>
                        <div className="text-[11px] text-mid-ash mb-1">
                          Rows: {group.rows.slice(0, 8).join(', ')}{group.rows.length > 8 ? ` +${group.rows.length - 8} more` : ''}
                        </div>
                        {hintObj && (
                          <div className="text-[11px] text-yellow-300/80 leading-relaxed">
                            {hintObj.hint}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Detailed Error Breakdown Box */}
          {result.failed > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Issuance Error Details ({result.failed} failed certificate{result.failed > 1 ? 's' : ''})</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyErrors}
                  className="inline-flex items-center gap-1.5 text-xs text-lavender-spark hover:underline cursor-pointer"
                >
                  {copiedErrorLog ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-signal-green" />
                      <span className="text-signal-green">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Error Log</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-ash-veil">
                The following certificates failed to mint on CKB. Review the specific errors below to correct your file or wallet:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {result.certificates
                  .filter((cert) => !cert.success)
                  .map((cert) => {
                    const hintObj = getBatchErrorHint(cert.error);
                    return (
                      <div
                        key={cert.row}
                        className="p-3 bg-midnight-plum/80 rounded-lg border border-red-500/20 text-xs space-y-1.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-semibold text-bone-white">
                            Row #{cert.row}{cert.recipientName ? ` • ${cert.recipientName}` : ''}{cert.courseName ? ` • ${cert.courseName}` : ''}
                          </span>
                          <span className="font-mono text-[11px] text-mid-ash">
                            {truncateAddress(cert.recipientAddress, 10, 6)}
                          </span>
                        </div>
                        <div className="text-red-400 font-mono text-[11px] break-all">
                          Error: {cert.error || 'Issuance failed'}
                        </div>
                        {hintObj && (
                          <div className="pt-1 text-[11px] text-yellow-300/90 flex flex-col gap-1 border-t border-fog-line/10">
                            <div>{hintObj.hint}</div>
                            {hintObj.link && (
                              <a
                                href={hintObj.link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lavender-spark hover:underline inline-flex items-center gap-1 w-fit"
                              >
                                {hintObj.link.label}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Results Table */}
          {result.certificates.length > 0 && (
            <div className="overflow-x-auto max-h-72 overflow-y-auto mb-6">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-shadow-plum">
                  <tr className="border-b border-fog-line/10">
                    <th className="text-left py-2.5 px-3 text-mid-ash font-semibold">#</th>
                    <th className="text-left py-2.5 px-3 text-mid-ash font-semibold">Name</th>
                    <th className="text-left py-2.5 px-3 text-mid-ash font-semibold">Address</th>
                    <th className="text-left py-2.5 px-3 text-mid-ash font-semibold">Status</th>
                    <th className="text-left py-2.5 px-3 text-mid-ash font-semibold">Certificate ID / Error Details</th>
                  </tr>
                </thead>
                <tbody>
                  {result.certificates.slice(0, 50).map((cert) => (
                    <tr key={cert.row} className="border-b border-fog-line/5 hover:bg-white/[0.02]">
                      <td className="py-2 px-3 text-mid-ash">{cert.row}</td>
                      <td className="py-2 px-3 text-bone-white font-medium truncate max-w-[120px]">
                        {cert.recipientName || '-'}
                      </td>
                      <td className="py-2 px-3 font-mono text-ash-veil">
                        {truncateAddress(cert.recipientAddress, 8, 6)}
                      </td>
                      <td className="py-2 px-3">
                        {cert.success ? (
                          <Badge variant="success" className="text-[10px]">Success</Badge>
                        ) : (
                          <Badge variant="danger" className="text-[10px]">Failed</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {cert.success ? (
                          <span className="font-mono text-mid-ash text-[11px]">
                            {cert.certificateId ? truncateAddress(cert.certificateId, 8, 6) : '-'}
                          </span>
                        ) : (
                          <span className="text-red-400 text-xs font-mono truncate block max-w-sm" title={cert.error}>
                            {cert.error || 'Failed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.certificates.length > 50 && (
                <p className="text-xs text-mid-ash text-center py-2">
                  ... and {result.certificates.length - 50} more results
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-fog-line/10">
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="flex-1 text-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {result.failed > 0 ? 'Edit File & Re-upload' : 'Issue More'}
            </Button>
            <Button
              onClick={handleViewCertificates}
              className="flex-1 text-xs shadow-glow-green/30"
            >
              View Certificates →
            </Button>
          </div>
        </Card>
      )}

      {/* Error */}
      {issueMutation.isError && (
        <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Batch Issuance Failed</span>
          </div>
          <p className="text-sm text-red-400">
            Failed to issue certificates: {issueMutation.error?.message || 'Unknown error'}
          </p>
          {(() => {
            const hintObj = getBatchErrorHint(issueMutation.error?.message);
            if (!hintObj) return null;
            return (
              <div className="p-3 bg-midnight-plum/80 rounded-lg border border-red-500/20 text-xs text-yellow-300/90 space-y-1">
                <div>{hintObj.hint}</div>
                {hintObj.link && (
                  <a
                    href={hintObj.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lavender-spark hover:underline inline-flex items-center gap-1"
                  >
                    {hintObj.link.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })()}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancel}
            className="mt-2 text-xs"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

