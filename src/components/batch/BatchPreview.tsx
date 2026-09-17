'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { PaperCertificate } from '@/components/certificate';
import type {
  BatchEntry,
  BatchProgress,
  VisualStyleConfig,
  CertificateDNA,
  CertificateLayout,
  CertificateTheme,
} from '@/types';
import { truncateAddress, cn } from '@/utils';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Palette,
  Sparkles,
  Info,
} from 'lucide-react';

export interface BatchPreviewProps {
  entries: BatchEntry[];
  estimatedCost: string;
  exactTotalCapacity?: number;
  clusterId?: string;
  issuerName?: string;
  issuerDescription?: string;
  client?: any;
  onConfirm: (defaultStyle: VisualStyleConfig) => void;
  onCancel: () => void;
  loading?: boolean;
  progress?: BatchProgress | null;
}

const LAYOUT_OPTIONS: { id: CertificateLayout; label: string; icon: string; description: string }[] = [
  { id: 'classic', label: 'Classic', icon: '📜', description: 'Traditional ornate border' },
  { id: 'modern', label: 'Modern', icon: '🎨', description: 'Bold header banner' },
  { id: 'compact', label: 'Compact', icon: '📄', description: 'Clean space-saver' },
  { id: 'detailed', label: 'Detailed', icon: '📋', description: 'Full breakdown & skills' },
  { id: 'badge', label: 'Badge', icon: '🎓', description: 'Digital seal & badge' },
];

const THEME_OPTIONS: { id: CertificateTheme; label: string; color: string }[] = [
  { id: 'blue', label: 'Blue', color: '#1E40AF' },
  { id: 'purple', label: 'Purple', color: '#6B21A8' },
  { id: 'green', label: 'Green', color: '#166534' },
  { id: 'gold', label: 'Gold', color: '#92400E' },
  { id: 'red', label: 'Red', color: '#991B1B' },
  { id: 'custom', label: 'Custom', color: '#F26F21' },
];

export function BatchPreview({
  entries,
  estimatedCost,
  exactTotalCapacity,
  clusterId,
  issuerName,
  issuerDescription,
  client,
  onConfirm,
  onCancel,
  loading = false,
  progress,
}: BatchPreviewProps) {
  const [defaultStyle, setDefaultStyle] = useState<VisualStyleConfig>({
    layout: 'classic',
    theme: 'blue',
    customColor: '#1E40AF',
    customTitle: '',
  });

  const [liveEntries, setLiveEntries] = useState<BatchEntry[]>(entries);
  const [liveCost, setLiveCost] = useState<string>(estimatedCost);
  const [liveExactCapacity, setLiveExactCapacity] = useState<number | undefined>(exactTotalCapacity);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  // Auto-recalculate exact CKB capacities when style changes
  useEffect(() => {
    if (!clusterId) {
      setLiveEntries(entries);
      setLiveCost(estimatedCost);
      setLiveExactCapacity(exactTotalCapacity);
      return;
    }

    const timer = setTimeout(async () => {
      setIsRecalculating(true);
      try {
        const { calculateBatchCapacity } = await import('@/lib/credentials');
        const res = await calculateBatchCapacity(entries, {
          clusterId,
          issuerName: issuerName || 'Accredited Institution',
          issuerDescription,
          defaultStyle,
          client,
        });
        setLiveEntries(res.entriesWithCapacity);
        setLiveCost(`${res.totalCapacity.toLocaleString()} CKB`);
        setLiveExactCapacity(res.totalCapacity);
      } catch {
        setLiveEntries(entries);
        setLiveCost(estimatedCost);
        setLiveExactCapacity(exactTotalCapacity);
      } finally {
        setIsRecalculating(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [entries, defaultStyle, clusterId, issuerName, issuerDescription, client, estimatedCost, exactTotalCapacity]);

  const validCount = liveEntries.filter((e) => e.valid).length;
  const invalidCount = liveEntries.filter((e) => !e.valid).length;

  function updateStyleField<K extends keyof VisualStyleConfig>(
    field: K,
    value: VisualStyleConfig[K]
  ) {
    setDefaultStyle((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const firstValidEntry = liveEntries.find((e) => e.valid) || liveEntries[0];

  const previewCertificate: CertificateDNA = useMemo(() => {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://schema.org',
      ],
      id: '0x0000000000000000000000000000000000000000000000000000000000000000',
      type: ['VerifiableCredential', 'CourseCertificate'],
      issuer: {
        id: 'ckt1qcluster',
        name: 'Certificate Authority',
      },
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id:
          firstValidEntry?.recipientAddress ||
          'ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv',
        type: 'CourseCertificate',
        name: firstValidEntry?.recipientName || 'Sample Recipient',
        courseName: firstValidEntry?.courseName || 'Sample Course',
        completionDate:
          firstValidEntry?.completionDate || new Date().toISOString().split('T')[0],
        grade: firstValidEntry?.grade,
        score: firstValidEntry?.score,
        skills:
          firstValidEntry?.skills && firstValidEntry.skills.length > 0
            ? firstValidEntry.skills
            : undefined,
        issuerName: 'Certificate Authority',
        metadata: {
          layout: firstValidEntry?.layout || defaultStyle.layout,
          theme: firstValidEntry?.theme || defaultStyle.theme,
          customColor: firstValidEntry?.customColor || defaultStyle.customColor,
          customTitle: firstValidEntry?.customTitle || defaultStyle.customTitle,
        },
      },
    };
  }, [firstValidEntry, defaultStyle]);

  return (
    <div className="space-y-6">
      <Card variant="default" padding="lg">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            Preview ({entries.length} certificates)
          </h2>
          <p className="text-sm text-slate-400">
            Review the entries and choose your default visual style before issuing certificates
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">{validCount}</div>
            <div className="text-sm text-slate-400">Valid</div>
          </div>
          <div className="flex-1 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400">{invalidCount}</div>
            <div className="text-sm text-slate-400">Invalid</div>
          </div>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mb-6 p-4 bg-slate-800 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-400">Progress</span>
              <span className="text-sm text-white">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{truncateAddress(progress.currentAddress, 8, 6)}</span>
              <span className="capitalize">{progress.status}</span>
            </div>
          </div>
        )}

        {/* Style & Appearance Customization */}
        <div className="mb-8 p-5 bg-midnight-plum/60 rounded-2xl border border-fog-line/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-bone-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-lavender-spark" />
              <span>Batch Certificate Style & Appearance</span>
            </h3>
            <span className="text-[11px] font-mono text-lavender-spark bg-lavender-spark/10 border border-lavender-spark/20 px-2.5 py-0.5 rounded-full">
              Global Default
            </span>
          </div>

          {/* Banner explaining row override */}
          <div className="p-3.5 bg-blue-950/40 border border-blue-800/40 rounded-xl flex items-start gap-2.5 text-xs text-blue-200">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p>
              Individual entries with custom layout or customTitle in CSV/JSON will override this default style.
            </p>
          </div>

          {/* Layout Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-ash-veil">
              Default Certificate Layout
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {LAYOUT_OPTIONS.map((opt) => {
                const isSelected = defaultStyle.layout === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateStyleField('layout', opt.id)}
                    className={cn(
                      'p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-lavender-spark/50',
                      isSelected
                        ? 'border-lavender-spark bg-lavender-spark/15 text-bone-white shadow-glow-violet/20 font-semibold'
                        : 'border-fog-line/15 bg-midnight-plum/60 text-ash-veil hover:border-fog-line/30 hover:text-bone-white'
                    )}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-ash-veil">
              Default Theme Accent
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {THEME_OPTIONS.map((thm) => {
                const isSelected = defaultStyle.theme === thm.id;
                return (
                  <button
                    key={thm.id}
                    type="button"
                    onClick={() => updateStyleField('theme', thm.id)}
                    className={cn(
                      'p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-lavender-spark/50',
                      isSelected
                        ? 'border-lavender-spark bg-lavender-spark/15 text-bone-white shadow-glow-violet/20 font-semibold'
                        : 'border-fog-line/15 bg-midnight-plum/60 text-ash-veil hover:border-fog-line/30 hover:text-bone-white'
                    )}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-xs"
                      style={{
                        backgroundColor:
                          thm.id === 'custom' && defaultStyle.customColor
                            ? defaultStyle.customColor
                            : thm.color,
                      }}
                    />
                    <span className="text-xs">{thm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Picker if theme === 'custom' */}
          {defaultStyle.theme === 'custom' && (
            <div className="p-3.5 rounded-xl bg-midnight-plum/60 border border-lavender-spark/20 space-y-2 animate-fade-in">
              <label className="block text-xs font-medium text-ash-veil">
                Custom Hex Color Accent
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Color picker"
                  onChange={(e) => updateStyleField('customColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-fog-line/20 bg-transparent p-0 flex-shrink-0"
                />
                <input
                  type="text"
                  placeholder="#1E40AF"
                  value={defaultStyle.customColor || ''}
                  onChange={(e) => updateStyleField('customColor', e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-midnight-plum border border-fog-line/15 text-bone-white font-mono placeholder-mid-ash text-sm focus:outline-none focus:ring-2 focus:ring-lavender-spark/40 focus:border-lavender-spark/50 transition-all"
                />
              </div>
            </div>
          )}

          {/* Custom Certificate Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ash-veil">
              Custom Certificate Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. DIPLOMA, CERTIFICATE OF EXCELLENCE"
              value={defaultStyle.customTitle || ''}
              onChange={(e) => updateStyleField('customTitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-midnight-plum border border-fog-line/15 text-bone-white placeholder-mid-ash text-sm focus:outline-none focus:ring-2 focus:ring-lavender-spark/40 focus:border-lavender-spark/50 transition-all duration-200"
            />
            <p className="text-[11px] text-mid-ash">
              Optional custom headline applied to certificates without their own row-level customTitle
            </p>
          </div>
        </div>

        {/* Live WYSIWYG Preview Section */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lavender-spark" />
              <h3 className="text-xs font-semibold text-bone-white uppercase tracking-wider">
                Live Certificate Preview {firstValidEntry ? `(${firstValidEntry.recipientName || 'First Valid Entry'})` : ''}
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-midnight-plum text-lavender-spark border border-lavender-spark/20">
              WYSIWYG
            </span>
          </div>

          <div className="p-4 sm:p-5 bg-midnight-plum/40 rounded-2xl border border-fog-line/15 shadow-xl backdrop-blur-xs">
            <PaperCertificate
              certificate={previewCertificate}
              certificateId="PREVIEW_ID"
              layout={firstValidEntry?.layout || defaultStyle.layout}
              theme={firstValidEntry?.theme || defaultStyle.theme}
              customColor={firstValidEntry?.customColor || defaultStyle.customColor}
              customTitle={firstValidEntry?.customTitle || defaultStyle.customTitle}
              className="transform scale-100 origin-top"
            />
          </div>
        </div>

        {/* Invalid entries summary banner */}
        {invalidCount > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-left space-y-2">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{invalidCount} Invalid Row{invalidCount > 1 ? 's' : ''} Found in File</span>
            </div>
            <p className="text-xs text-ash-veil">
              These rows have validation issues and will be skipped during issuance. Review the errors below to edit your file:
            </p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {entries
                .filter((e) => !e.valid)
                .map((e) => (
                  <div
                    key={e.row}
                    className="text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-midnight-plum/70 border border-red-500/20"
                  >
                    <span className="font-semibold text-bone-white">
                      Row #{e.row} {e.recipientName ? `• ${e.recipientName}` : ''}
                    </span>
                    <span className="text-red-400 font-mono text-[11px]">
                      {e.errors?.join(', ') || 'Validation error'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Table of Entries */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400 font-medium">#</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Address</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Name</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Course</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Expires</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Style</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Capacity</th>
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {liveEntries.slice(0, 10).map((entry) => (
                <tr
                  key={entry.row}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >
                  <td className="py-2 px-3 text-slate-500">{entry.row}</td>
                  <td className="py-2 px-3 font-mono text-white">
                    {truncateAddress(entry.recipientAddress, 8, 6)}
                  </td>
                  <td className="py-2 px-3 text-white">{entry.recipientName || '-'}</td>
                  <td className="py-2 px-3 text-white">{entry.courseName}</td>
                  <td className="py-2 px-3 text-slate-400 text-xs">{entry.expirationDate || 'Never'}</td>
                  <td className="py-2 px-3 text-xs">
                    {entry.layout ? (
                      <Badge variant="neutral" className="capitalize text-[10px]">
                        {entry.layout}
                      </Badge>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">(Global)</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-xs font-mono">
                    {entry.valid && entry.exactCapacity ? (
                      <span className="text-bone-white font-medium">
                        {entry.exactCapacity.toLocaleString()} CKB
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {entry.valid ? (
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Valid
                      </Badge>
                    ) : (
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="danger" className="text-[10px]">
                          <XCircle className="w-3 h-3 mr-1" />
                          Invalid
                        </Badge>
                        {entry.errors && entry.errors.length > 0 && (
                          <span
                            className="text-[11px] text-red-400 font-normal leading-tight max-w-[200px]"
                            title={entry.errors.join(', ')}
                          >
                            {entry.errors.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {liveEntries.length > 10 && (
            <p className="text-sm text-slate-500 text-center py-2">
              ... and {liveEntries.length - 10} more entries
            </p>
          )}
        </div>

        {/* Cost Estimate */}
        <div className="p-4 bg-slate-800 rounded-lg mb-6 border border-slate-700/50">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-medium">Total Locked Capacity</span>
                {liveExactCapacity && !isRecalculating && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
                    Exact on-chain
                  </span>
                )}
                {isRecalculating && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lavender-spark/15 text-lavender-spark border border-lavender-spark/30 animate-pulse">
                    Calculating exact CKB...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact CKB required to lock all certificates · 100% reclaimable by melting
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-green-400 font-mono">
                {liveCost}
              </span>
              {liveExactCapacity && validCount > 0 && (
                <span className="block text-xs text-slate-400 mt-0.5">
                  avg. ~{Math.round(liveExactCapacity / validCount).toLocaleString()} CKB / cert
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(defaultStyle)}
            disabled={loading || validCount === 0}
            loading={loading}
            className="flex-1"
          >
            {loading ? 'Issuing...' : `Issue ${validCount} Certificates`}
          </Button>
        </div>
      </Card>
    </div>
  );
}
