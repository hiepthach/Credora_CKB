'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, Modal, EmptyState } from '@/components/ui';
import { PaperCertificate } from '@/components/certificate/PaperCertificate';
import { Eye, Sparkles, ArrowRight, Palette, Check } from 'lucide-react';
import type { CertificateDNA, CertificateLayout, CertificateTheme } from '@/types';

export interface CertificatePreset {
  id: string;
  name: string;
  description: string;
  layout: CertificateLayout;
  theme: CertificateTheme;
  badge: string;
}

export const CERTIFICATE_PRESETS: CertificatePreset[] = [
  {
    id: 'academic-classic',
    name: 'Academic Classic',
    description: 'Traditional gold ornate border layout, ideal for formal academic degrees, graduation diplomas, and institutional honors.',
    layout: 'classic',
    theme: 'gold',
    badge: 'Classic Gold',
  },
  {
    id: 'modern-tech',
    name: 'Modern Tech',
    description: 'Clean modern header banner aesthetic with crisp typography for engineering courses, bootcamps, and developer credentials.',
    layout: 'modern',
    theme: 'blue',
    badge: 'Modern Blue',
  },
  {
    id: 'executive-detailed',
    name: 'Executive Detailed',
    description: 'Comprehensive multi-column layout showcasing verified competencies, subject grades, and formal institutional verification.',
    layout: 'detailed',
    theme: 'purple',
    badge: 'Executive Purple',
  },
  {
    id: 'achievement-badge',
    name: 'Achievement Badge',
    description: 'Centered emblem and official badge highlight, perfect for hackathon prizes, participation awards, and special achievements.',
    layout: 'badge',
    theme: 'green',
    badge: 'Badge Green',
  },
  {
    id: 'compact-diploma',
    name: 'Compact Diploma',
    description: 'Streamlined horizontal layout designed for rapid micro-credentials, workshop completions, and compact verification.',
    layout: 'compact',
    theme: 'red',
    badge: 'Compact Red',
  },
];

const THEME_BADGE_CLASSES: Record<CertificateTheme, string> = {
  gold: 'bg-yellow-950/60 text-yellow-400 border-yellow-700/50',
  blue: 'bg-blue-950/60 text-blue-400 border-blue-700/50',
  purple: 'bg-purple-950/60 text-purple-400 border-purple-700/50',
  green: 'bg-emerald-950/60 text-emerald-400 border-emerald-700/50',
  red: 'bg-red-950/60 text-red-400 border-red-700/50',
  custom: 'bg-slate-900 text-slate-400 border-slate-700',
};

export interface TemplateListProps {
  clusterId: string;
  clusterName?: string;
  presets?: CertificatePreset[];
  onSelectPreset?: (preset: CertificatePreset) => void;
  // Backward compatibility props
  onSelect?: (preset: CertificatePreset) => void;
  templates?: any[];
  onCreateNew?: () => void;
  onDelete?: (templateId: string) => void;
}

export function TemplateList({
  clusterId,
  clusterName = 'CKB Certificate Authority',
  presets = CERTIFICATE_PRESETS,
  onSelectPreset,
  onSelect,
}: TemplateListProps) {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState<CertificatePreset | null>(null);

  const handleIssue = (preset: CertificatePreset) => {
    if (onSelectPreset) {
      onSelectPreset(preset);
      return;
    }
    if (onSelect) {
      onSelect(preset);
      return;
    }
    router.push(
      `/certificates/issue?cluster=${encodeURIComponent(clusterId)}&layout=${encodeURIComponent(
        preset.layout
      )}&theme=${encodeURIComponent(preset.theme)}`
    );
  };

  const createSampleCertificate = (preset: CertificatePreset): CertificateDNA => ({
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schema.org',
    ],
    id: '0x0000000000000000000000000000000000000000000000000000000000000000',
    type: ['VerifiableCredential', 'CourseCertificate'],
    issuer: {
      id: clusterId || 'ckt1qcluster',
      name: clusterName || 'CKB Certificate Authority',
    },
    issuanceDate: '2026-02-01T00:00:00Z',
    credentialSubject: {
      id: 'ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv',
      type: 'CourseCertificate',
      name: 'Jane Doe',
      courseName: 'Certified CKB & DOB Developer',
      completionDate: '2026-02-01',
      grade: 'A+',
      score: 98,
      skills: ['CKB-VM', 'Spore DOB', 'Cell Model'],
      issuerName: clusterName || 'CKB Certificate Authority',
      metadata: {
        layout: preset.layout,
        theme: preset.theme,
      },
    },
  });

  if (presets.length === 0) {
    return (
      <EmptyState
        icon="🎨"
        title="No Certificate Styles Found"
        description="No style presets match your current filter. Clear your filter to view all preset templates."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-bone-white tracking-tight flex items-center gap-2">
            <Palette className="w-5 h-5 text-lavender-spark" />
            Certificate Style Presets ({presets.length})
          </h2>
          <p className="text-xs text-ash-veil mt-1">
            Choose a preset template style to issue branded, verifiable DOB credentials for{' '}
            <strong className="text-bone-white font-medium">{clusterName}</strong>
          </p>
        </div>
      </div>

      {/* Grid of Presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presets.map((preset) => {
          const sampleCert = createSampleCertificate(preset);
          const themeBadgeClass = THEME_BADGE_CLASSES[preset.theme] || THEME_BADGE_CLASSES.blue;

          return (
            <Card
              key={preset.id}
              variant="default"
              padding="lg"
              className="flex flex-col justify-between border-fog-line/15 hover:border-lavender-spark/40 transition-all duration-300 hover:shadow-glow-violet/20 group"
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-bone-white tracking-tight group-hover:text-lavender-spark transition-colors">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-ash-veil mt-1 leading-relaxed line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] uppercase tracking-wider font-semibold border ${themeBadgeClass}`}>
                    {preset.badge}
                  </Badge>
                  <Badge variant="neutral" className="text-[10px] uppercase tracking-wider">
                    Layout: {preset.layout}
                  </Badge>
                </div>

                {/* Mini Preview Box */}
                <div className="relative mt-3 rounded-xl overflow-hidden border border-fog-line/10 bg-midnight-plum/40 p-2 sm:p-3 shadow-inner">
                  <div className="transform scale-[0.72] sm:scale-[0.78] origin-top -mb-16 sm:-mb-12 pointer-events-none select-none">
                    <PaperCertificate
                      certificate={sampleCert}
                      certificateId="0xSAMPLE_PREVIEW"
                      layout={preset.layout}
                      theme={preset.theme}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-fog-line/10">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedPreset(preset)}
                  className="flex-1 text-xs gap-1.5 justify-center"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleIssue(preset)}
                  className="flex-1 text-xs gap-1.5 justify-center shadow-glow-green/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-signal-green" />
                  Issue With This Style
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal for Full Preview */}
      <Modal
        isOpen={!!selectedPreset}
        onClose={() => setSelectedPreset(null)}
        title={selectedPreset ? `Preview: ${selectedPreset.name}` : 'Template Preview'}
        size="xl"
      >
        {selectedPreset && (
          <div className="space-y-6">
            <div className="p-4 bg-midnight-plum/40 rounded-xl border border-fog-line/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-ash-veil">{selectedPreset.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-[10px] uppercase font-semibold border ${THEME_BADGE_CLASSES[selectedPreset.theme]}`}>
                    Theme: {selectedPreset.theme}
                  </Badge>
                  <Badge variant="neutral" className="text-[10px] uppercase">
                    Layout: {selectedPreset.layout}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => {
                  const preset = selectedPreset;
                  setSelectedPreset(null);
                  handleIssue(preset);
                }}
                className="text-xs gap-1.5 shadow-glow-green/30 flex-shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-signal-green" />
                Use This Style to Issue
              </Button>
            </div>

            <div className="p-4 sm:p-6 bg-midnight-plum/30 rounded-2xl border border-fog-line/15 overflow-auto max-h-[65vh]">
              <PaperCertificate
                certificate={createSampleCertificate(selectedPreset)}
                certificateId="0xSAMPLE_PREVIEW"
                layout={selectedPreset.layout}
                theme={selectedPreset.theme}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setSelectedPreset(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export { getDefaultCertificateFields } from '@/lib/credentials/services';
