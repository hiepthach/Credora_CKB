'use client';

import React from 'react';
import type { CertificateDNA, CertificateLayout, CertificateTheme } from '@/types';
import { formatDate, truncateAddress, cn } from '@/utils';

export interface PaperCertificateProps {
  certificate: CertificateDNA;
  certificateId: string;
  layout?: CertificateLayout;
  theme?: CertificateTheme;
  customColor?: string;
  customTitle?: string;
  isExpired?: boolean;
  className?: string;
}

export const PRESET_THEMES: Record<
  Exclude<CertificateTheme, 'custom'>,
  { primary: string; secondary: string; bg: string }
> = {
  blue: { primary: '#1E40AF', secondary: '#3B82F6', bg: '#EFF6FF' },
  purple: { primary: '#6B21A8', secondary: '#9333EA', bg: '#FAF5FF' },
  green: { primary: '#166534', secondary: '#22C55E', bg: '#F0FDF4' },
  gold: { primary: '#92400E', secondary: '#F59E0B', bg: '#FFFBEB' },
  red: { primary: '#991B1B', secondary: '#EF4444', bg: '#FEF2F2' },
};

function parseHexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  return null;
}

export function resolveThemeColors(
  theme?: CertificateTheme,
  customColor?: string
): { primary: string; secondary: string; bg: string } {
  if (theme === 'custom' && customColor) {
    const rgb = parseHexToRgb(customColor);
    if (rgb) {
      return {
        primary: customColor,
        secondary: customColor,
        bg: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`,
      };
    }
  }

  const validTheme =
    theme && theme in PRESET_THEMES
      ? (theme as Exclude<CertificateTheme, 'custom'>)
      : 'blue';

  return PRESET_THEMES[validTheme] || PRESET_THEMES.blue;
}

export function PaperCertificate({
  certificate,
  certificateId,
  layout,
  theme,
  customColor,
  customTitle,
  isExpired = false,
  className,
}: PaperCertificateProps) {
  const metadata = certificate.credentialSubject?.metadata;
  const activeLayout: CertificateLayout =
    layout || (metadata?.layout as CertificateLayout) || 'classic';
  const activeTheme: CertificateTheme =
    theme || (metadata?.theme as CertificateTheme) || 'blue';
  const activeCustomColor: string | undefined =
    customColor || (typeof metadata?.customColor === 'string' ? metadata.customColor : undefined);
  const activeCustomTitle: string | undefined =
    customTitle || (typeof metadata?.customTitle === 'string' ? metadata.customTitle : undefined);

  const colors = resolveThemeColors(activeTheme, activeCustomColor);

  const subject = certificate.credentialSubject || { type: 'CourseCertificate' };
  const recipientName = subject.name || 'Certificate Recipient';
  const courseName = subject.courseName || 'Certificate Course';
  const issuerName = certificate.issuer?.name || subject.issuerName || 'CKB Certificate Authority';
  const formattedDate = subject.completionDate
    ? formatDate(subject.completionDate)
    : certificate.issuanceDate
    ? formatDate(certificate.issuanceDate)
    : 'N/A';
  const grade = subject.grade;
  const score = subject.score;
  const skills = subject.skills || [];

  const renderOfficialSeal = (size: 'sm' | 'md' = 'md') => (
    <div className="flex items-center gap-2.5">
      <div className="text-right">
        <p className="text-[11px] font-semibold text-gray-700 tracking-tight leading-tight">
          CKB DOB Verified
        </p>
        <p className="text-[9px] font-mono text-gray-400">
          {truncateAddress(certificateId, 8, 4)}
        </p>
      </div>
      <div
        className={cn(
          'rounded-full border-2 flex flex-col items-center justify-center bg-white shadow-sm flex-shrink-0',
          size === 'sm' ? 'w-10 h-10' : 'w-14 h-14'
        )}
        style={{ borderColor: colors.secondary }}
      >
        <span
          className={cn('font-bold leading-none', size === 'sm' ? 'text-xs' : 'text-base')}
          style={{ color: colors.secondary }}
        >
          ✓
        </span>
        <span
          className={cn('font-semibold uppercase tracking-wider', size === 'sm' ? 'text-[6px]' : 'text-[8px]')}
          style={{ color: colors.primary }}
        >
          DOB
        </span>
      </div>
    </div>
  );

  const renderExpiredBanner = () => {
    if (!isExpired) return null;
    return (
      <div className="mb-4 p-2.5 bg-red-100 border border-red-300 rounded-lg text-center">
        <span className="text-xs font-bold text-red-700 tracking-wider uppercase">
          ⚠️ EXPIRED CERTIFICATE
        </span>
      </div>
    );
  };

  // 1. Classic Layout
  const renderClassicLayout = () => (
    <div
      className="border-4 border-double rounded-xl p-8 sm:p-10 md:p-12 bg-[#FCFBF7] relative overflow-hidden text-gray-800 shadow-md min-h-[420px] flex flex-col justify-between"
      style={{ borderColor: colors.primary }}
    >
      {/* Subtle Inner Decorative Border */}
      <div
        className="absolute inset-2 sm:inset-3.5 border pointer-events-none rounded-lg opacity-30"
        style={{ borderColor: colors.secondary }}
      />
      {/* Corner Filigree Accents */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 pointer-events-none opacity-40" style={{ borderColor: colors.primary }} />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 pointer-events-none opacity-40" style={{ borderColor: colors.primary }} />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 pointer-events-none opacity-40" style={{ borderColor: colors.primary }} />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 pointer-events-none opacity-40" style={{ borderColor: colors.primary }} />

      {renderExpiredBanner()}

      <div>
        {/* Header Badge & Title */}
        <div className="text-center mb-6">
          <div
            className="inline-block px-5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase text-white shadow-sm mb-3"
            style={{ backgroundColor: colors.secondary }}
          >
            {activeCustomTitle || 'CERTIFICATE OF COMPLETION'}
          </div>
        </div>

        {/* Decorative line */}
        <div className="flex items-center justify-center mb-6 max-w-md mx-auto">
          <div className="flex-1 h-px bg-gray-300" />
          <div className="mx-4 text-sm" style={{ color: colors.secondary }}>
            ★ ★ ★
          </div>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Recipient */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 font-serif italic mb-2">This certifies that</p>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-2 font-serif">
            {recipientName}
          </h3>
          <p className="text-sm text-gray-500 font-serif italic">
            has successfully fulfilled all requirements and completed
          </p>
        </div>

        {/* Course Details Card */}
        <div className="rounded-xl p-4 sm:p-5 mb-6 text-center border border-gray-100 max-w-2xl mx-auto" style={{ backgroundColor: colors.bg }}>
          <h4 className="font-semibold text-gray-800 text-lg sm:text-xl">{courseName}</h4>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs text-gray-600">
            <span>Date: <strong>{formattedDate}</strong></span>
            {grade && <span>Grade: <strong style={{ color: colors.primary }}>{grade}</strong></span>}
            {score !== undefined && <span>Score: <strong style={{ color: colors.primary }}>{score}%</strong></span>}
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3 pt-2.5 border-t border-gray-200/60">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-white text-gray-700 border border-gray-200 shadow-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end mt-8 pt-4 border-t border-gray-200/80 relative z-10">
        <div className="text-left">
          <div className="w-36 sm:w-48 border-b border-gray-400 pb-1 mb-1 font-serif italic text-gray-700 text-xs sm:text-sm">
            {issuerName}
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider font-semibold">Authorized Authority</p>
        </div>
        <div>
          {renderOfficialSeal('md')}
        </div>
      </div>
    </div>
  );

  // 2. Modern Layout
  const renderModernLayout = () => (
    <div className="rounded-xl overflow-hidden bg-white text-gray-800 shadow-sm border border-gray-200">
      {/* Modern Header Banner */}
      <div
        className="p-8 text-center text-white relative overflow-hidden"
        style={{ backgroundColor: colors.primary }}
      >
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {activeCustomTitle || 'Certificate'}
          </h2>
          <p className="text-white/80 text-sm font-medium mt-1 uppercase tracking-widest">
            of Achievement
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {renderExpiredBanner()}

        <div className="text-center mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
            Awarded to
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {recipientName}
          </h3>
        </div>

        {/* Details Box */}
        <div className="rounded-xl p-5 mb-6 border border-gray-100" style={{ backgroundColor: colors.bg }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Course Program</p>
              <p className="font-bold text-gray-800 text-lg mt-0.5">{courseName}</p>
            </div>
            {(grade || score !== undefined) && (
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Result</p>
                <p className="font-extrabold text-base" style={{ color: colors.primary }}>
                  {grade || `${score}%`}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-600">
            <span>Completed: <strong>{formattedDate}</strong></span>
            <span className="font-semibold" style={{ color: colors.primary }}>
              {issuerName}
            </span>
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-gray-200/60">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-gray-700 border border-gray-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-gray-500">
            Issued by <strong className="text-gray-700">{issuerName}</strong>
          </div>
          <div>
            {renderOfficialSeal('sm')}
          </div>
        </div>
      </div>
    </div>
  );

  // 3. Compact Layout
  const renderCompactLayout = () => (
    <div
      className="border rounded-xl p-6 bg-white text-gray-800 shadow-sm"
      style={{ borderColor: colors.secondary }}
    >
      {renderExpiredBanner()}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div
            className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase text-white tracking-wide mb-1"
            style={{ backgroundColor: colors.secondary }}
          >
            {activeCustomTitle || 'Certificate'}
          </div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">{recipientName}</h3>
          <p className="text-sm font-medium text-gray-600">{courseName}</p>
          <p className="text-xs text-gray-500">Issuer: {issuerName}</p>
        </div>

        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3">
          <div className="text-right">
            {grade && (
              <p className="text-sm font-bold" style={{ color: colors.primary }}>
                Grade: {grade}
              </p>
            )}
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
          <div>
            {renderOfficialSeal('sm')}
          </div>
        </div>
      </div>
    </div>
  );

  // 4. Detailed Layout
  const renderDetailedLayout = () => (
    <div
      className="border rounded-xl p-6 sm:p-8 bg-white text-gray-800 shadow-sm"
      style={{ borderColor: colors.primary }}
    >
      {renderExpiredBanner()}

      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b" style={{ borderColor: colors.secondary }}>
        <div
          className="inline-block px-3 py-1 rounded text-xs font-bold uppercase text-white tracking-wider mb-2"
          style={{ backgroundColor: colors.secondary }}
        >
          {activeCustomTitle || 'OFFICIAL CERTIFICATE'}
        </div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: colors.primary }}>
          Certificate of Excellence
        </h2>
      </div>

      {/* Recipient */}
      <div className="text-center mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">This is to certify that</p>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{recipientName}</h3>
      </div>

      {/* Course */}
      <div className="rounded-xl p-4 mb-6 border border-gray-100" style={{ backgroundColor: colors.bg }}>
        <p className="text-xs text-gray-600 text-center uppercase tracking-wide">
          has successfully completed the requirements for
        </p>
        <h4 className="text-lg sm:text-xl font-bold text-center mt-1.5" style={{ color: colors.primary }}>
          {courseName}
        </h4>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6 text-center text-xs p-3 rounded-lg bg-gray-50 border border-gray-200">
        <div>
          <p className="text-gray-500 text-[10px] uppercase font-semibold">Date</p>
          <p className="font-semibold text-gray-800 mt-0.5">{formattedDate}</p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase font-semibold">Grade</p>
          <p className="font-bold mt-0.5" style={{ color: colors.primary }}>
            {grade || (score !== undefined ? `${score}%` : 'Pass')}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase font-semibold">Issuer</p>
          <p className="font-semibold text-gray-800 mt-0.5 truncate">{issuerName}</p>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 text-center">
            Certified Skills & Competencies
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-end pt-4 border-t" style={{ borderColor: colors.secondary }}>
        <div className="text-left">
          <p className="font-bold text-sm text-gray-800">{issuerName}</p>
          <p className="text-xs text-gray-500">Certificate Authority</p>
        </div>
        <div>
          {renderOfficialSeal('md')}
        </div>
      </div>
    </div>
  );

  // 5. Badge Layout
  const renderBadgeLayout = () => (
    <div className="p-6 bg-white text-gray-800 rounded-xl shadow-sm border border-gray-200 text-center">
      {renderExpiredBanner()}

      <div
        className="w-36 h-36 mx-auto rounded-full flex flex-col items-center justify-center p-4 text-white shadow-md relative"
        style={{ backgroundColor: colors.primary }}
      >
        <span className="text-4xl mb-1">🎓</span>
        <h4 className="text-xs font-extrabold uppercase tracking-widest">
          {activeCustomTitle || 'CERTIFIED'}
        </h4>
      </div>

      <div className="mt-5 space-y-1">
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{recipientName}</h3>
        <p className="text-sm font-semibold" style={{ color: colors.primary }}>
          {courseName}
        </p>
        <p className="text-xs text-gray-500">Issued by {issuerName}</p>
        <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-4 pt-3 border-t border-gray-100">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
        {renderOfficialSeal('sm')}
      </div>
    </div>
  );

  const renderLayoutContent = () => {
    switch (activeLayout) {
      case 'modern':
        return renderModernLayout();
      case 'compact':
        return renderCompactLayout();
      case 'badge':
        return renderBadgeLayout();
      case 'detailed':
        return renderDetailedLayout();
      case 'classic':
      default:
        return renderClassicLayout();
    }
  };

  return (
    <div
      className={cn('print-certificate-target w-full transition-all', className)}
      data-theme={activeTheme}
      data-custom-color={activeCustomColor}
      data-custom-title={activeCustomTitle}
    >
      {renderLayoutContent()}
    </div>
  );
}
