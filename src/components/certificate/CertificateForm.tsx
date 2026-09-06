'use client';

import { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import type { CertificateLayout, CertificateTheme } from '@/types';
import { ArrowRight, Palette, Layout as LayoutIcon, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';
import { CERTIFICATE_PRESETS } from '@/components/template';
import { isDidInput } from '@/lib/did';
import { useWallet } from '@/hooks/useWallet';

export interface CertificateData {
  recipientAddress: string;
  recipientName: string;
  courseName: string;
  completionDate: string;
  expirationDate?: string;
  grade?: string;
  score?: number;
  skills?: string[];
  layout?: CertificateLayout;
  theme?: CertificateTheme;
  customColor?: string;
  customTitle?: string;
}

interface CertificateFormProps {
  clusterId: string;
  clusterName: string;
  defaultRecipientAddress?: string;
  defaultLayout?: CertificateLayout;
  defaultTheme?: CertificateTheme;
  defaultCustomColor?: string;
  defaultCustomTitle?: string;
  onSubmit: (data: CertificateData) => void;
  onChange?: (data: CertificateData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'Pass', 'Fail'];

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

export function CertificateForm({
  clusterId,
  clusterName,
  defaultRecipientAddress,
  defaultLayout = 'classic',
  defaultTheme = 'blue',
  defaultCustomColor = '#1E40AF',
  defaultCustomTitle = '',
  onSubmit,
  onChange,
  onCancel,
  loading = false,
}: CertificateFormProps) {
  const { client } = useWallet();
  const [resolvedInfo, setResolvedInfo] = useState<{
    address: string;
    isDid: boolean;
    display: string;
  } | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CertificateData>({
    recipientAddress: defaultRecipientAddress || '',
    recipientName: '',
    courseName: '',
    completionDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    grade: '',
    score: undefined,
    skills: [],
    layout: defaultLayout,
    theme: defaultTheme,
    customColor: defaultCustomColor,
    customTitle: defaultCustomTitle,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skillsInput, setSkillsInput] = useState('');

  // DID resolution effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      const input = formData.recipientAddress.trim();
      if (!input) {
        setResolvedInfo(null);
        setResolveError(null);
        return;
      }

      // Skip if it looks like a CKB address (immediate validation)
      if (input.startsWith('ckt') || input.startsWith('ckb')) {
        setResolvedInfo({ address: input, isDid: false, display: input });
        setResolveError(null);
        return;
      }

      // Try to resolve as DID
      if (!isDidInput(input)) {
        setResolvedInfo(null);
        setResolveError('Invalid format: must be CKB address or did:ckb:...');
        return;
      }

      if (!client) {
        setResolveError('Wallet not connected');
        return;
      }

      setIsResolving(true);
      try {
        const { resolveRecipientInput } = await import('@/lib/did');
        const resolved = await resolveRecipientInput(client, input);
        setResolvedInfo({
          address: resolved.targetAddress,
          isDid: true,
          display: resolved.isDid ? input : resolved.targetAddress,
        });
        setResolveError(null);
      } catch (err) {
        setResolveError(`DID not found on CKB: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setResolvedInfo(null);
      } finally {
        setIsResolving(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData.recipientAddress, client]);

  const notifyChange = (updatedData: CertificateData, currentSkillsInput = skillsInput) => {
    if (onChange) {
      onChange({
        ...updatedData,
        skills: currentSkillsInput
          ? currentSkillsInput.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
    }
  };

  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.recipientAddress.trim()) {
      newErrors.recipientAddress = 'Recipient address or DID is required';
    } else if (!isDidInput(formData.recipientAddress) &&
               !formData.recipientAddress.startsWith('ckt') &&
               !formData.recipientAddress.startsWith('ckb')) {
      newErrors.recipientAddress = 'Invalid format: must be CKB address (ckt/ckb) or did:ckb:...';
    }

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required';
    }

    if (!formData.courseName.trim()) {
      newErrors.courseName = 'Course name is required';
    }

    if (!formData.completionDate) {
      newErrors.completionDate = 'Completion date is required';
    }

    if (formData.expirationDate) {
      const expDate = new Date(formData.expirationDate);
      if (isNaN(expDate.getTime())) {
        newErrors.expirationDate = 'Invalid expiration date format';
      }
    }

    if (formData.score !== undefined && (formData.score < 0 || formData.score > 100)) {
      newErrors.score = 'Score must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      expirationDate: formData.expirationDate ? formData.expirationDate : undefined,
      skills: skillsInput
        ? skillsInput.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
    });
  };

  const updateField = <K extends keyof CertificateData>(field: K, value: CertificateData[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      notifyChange(next);
      return next;
    });
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleSkillsChange = (val: string) => {
    setSkillsInput(val);
    notifyChange(formData, val);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-midnight-plum rounded-xl border border-fog-line/10 flex items-center justify-between">
        <div>
          <p className="text-xs text-mid-ash uppercase tracking-wider font-semibold">Issuing Provider Authority</p>
          <p className="font-semibold text-bone-white text-base mt-0.5">{clusterName}</p>
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded bg-shadow-plum text-lavender-spark border border-lavender-spark/20">
          Spore Cluster
        </span>
      </div>

      {/* Recipient Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-bone-white uppercase tracking-wider flex items-center gap-2">
          <span>1. Recipient & Credential Info</span>
        </h3>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-ash-veil">
              Recipient Address or DID <span className="text-lavender-spark">*</span>
            </label>
            {defaultRecipientAddress && formData.recipientAddress !== defaultRecipientAddress && (
              <button
                type="button"
                onClick={() => updateField('recipientAddress', defaultRecipientAddress)}
                className="text-[11px] text-lavender-spark hover:underline"
              >
                Use my connected address
              </button>
            )}
          </div>
          <Input
            placeholder="ckt1qzda0cr08m85hc8j... or did:ckb:..."
            value={formData.recipientAddress}
            onChange={(v) => updateField('recipientAddress', v)}
            error={errors.recipientAddress}
            required
          />
          {/* DID Resolution Preview */}
          {isResolving && (
            <div className="flex items-center gap-2 mt-2 text-sm text-mid-ash">
              <Loader2 className="h-4 w-4 animate-spin" />
              Resolving DID...
            </div>
          )}
          {resolvedInfo && resolvedInfo.isDid && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-green-500/10 rounded-lg border border-green-500/30">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div className="text-sm">
                <span className="font-medium text-green-400">
                  DID Resolved
                </span>
                <span className="text-mid-ash ml-2">
                  to {formData.recipientAddress.slice(0, 8)}...{formData.recipientAddress.slice(-6)}
                </span>
              </div>
            </div>
          )}
          {resolveError && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-400">
                {resolveError}
              </span>
            </div>
          )}
        </div>

        <Input
          label="Recipient Full Name"
          placeholder="Student name (e.g. Satoshi Nakamoto)"
          value={formData.recipientName}
          onChange={(v) => updateField('recipientName', v)}
          error={errors.recipientName}
          required
        />

        <Input
          label="Course / Program Name"
          placeholder="Course or program name (e.g. Proof of Work Economics)"
          value={formData.courseName}
          onChange={(v) => updateField('courseName', v)}
          error={errors.courseName}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Completion Date"
            type="date"
            value={formData.completionDate}
            onChange={(v) => updateField('completionDate', v)}
            error={errors.completionDate}
            required
          />

          <Input
            label="Expiration Date (Optional)"
            type="date"
            value={formData.expirationDate || ''}
            onChange={(v) => updateField('expirationDate', v)}
            error={errors.expirationDate}
            helperText="Leave blank for lifetime validity"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-ash-veil">
              Grade (Optional)
            </label>
            <select
              value={formData.grade}
              onChange={(e) => updateField('grade', e.target.value || undefined)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-midnight-plum border border-fog-line/15 text-bone-white text-sm focus:outline-none focus:ring-2 focus:ring-lavender-spark/40 focus:border-lavender-spark/50 transition-all duration-200"
            >
              <option value="" className="bg-midnight-plum text-ash-veil">Select grade...</option>
              {GRADE_OPTIONS.map((grade) => (
                <option key={grade} value={grade} className="bg-midnight-plum text-bone-white">
                  {grade}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Score (% - Optional)"
            type="number"
            placeholder="98"
            value={formData.score?.toString() || ''}
            onChange={(v) => updateField('score', v ? parseInt(v, 10) : undefined)}
            error={errors.score}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ash-veil">
            Skills Certified (Optional)
          </label>
          <input
            type="text"
            placeholder="Rust, CKB-VM, Spore DOBs, Cryptography (comma-separated)"
            value={skillsInput}
            onChange={(e) => handleSkillsChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-midnight-plum border border-fog-line/15 text-bone-white placeholder-mid-ash text-sm focus:outline-none focus:ring-2 focus:ring-lavender-spark/40 focus:border-lavender-spark/50 transition-all duration-200"
          />
          <p className="text-[11px] text-mid-ash">
            Enter acquired skills separated by commas
          </p>
        </div>
      </div>

      {/* Style & Appearance Section */}
      <div className="space-y-5 pt-4 border-t border-fog-line/10">
        <h3 className="text-sm font-semibold text-bone-white uppercase tracking-wider flex items-center gap-2">
          <Palette className="w-4 h-4 text-lavender-spark" />
          <span>2. Certificate Style & Appearance</span>
        </h3>

        {/* Quick Template Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-bone-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-lavender-spark" />
              <span>Recommended Templates (1-Click Setup)</span>
            </label>
            <span className="text-[11px] text-mid-ash">Apply layout & theme preset</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CERTIFICATE_PRESETS.map((preset) => {
              const isSelected = formData.layout === preset.layout && formData.theme === preset.theme;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={`Preset: ${preset.name}`}
                  onClick={() => {
                    const updated = {
                      ...formData,
                      layout: preset.layout,
                      theme: preset.theme,
                    };
                    setFormData(updated);
                    notifyChange(updated);
                  }}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between relative group cursor-pointer',
                    isSelected
                      ? 'border-lavender-spark bg-lavender-spark/15 text-bone-white shadow-glow-violet/20 font-semibold'
                      : 'border-fog-line/15 bg-midnight-plum/60 text-ash-veil hover:border-fog-line/30 hover:text-bone-white'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-medium text-bone-white truncate">{preset.name}</span>
                    {isSelected && (
                      <span className="w-3.5 h-3.5 rounded-full bg-lavender-spark text-midnight-plum flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-mid-ash block truncate">
                    {preset.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-ash-veil">
            Certificate Layout
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {LAYOUT_OPTIONS.map((opt) => {
              const isSelected = formData.layout === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-label={opt.label}
                  onClick={() => updateField('layout', opt.id)}
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

        {/* Theme & Color Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-ash-veil">
            Theme & Color Accent
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {THEME_OPTIONS.map((thm) => {
              const isSelected = formData.theme === thm.id;
              return (
                <button
                  key={thm.id}
                  type="button"
                  onClick={() => updateField('theme', thm.id)}
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
                        thm.id === 'custom' && formData.customColor ? formData.customColor : thm.color,
                    }}
                  />
                  <span className="text-xs">{thm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Color Input if theme === 'custom' */}
        {formData.theme === 'custom' && (
          <div className="p-3.5 rounded-xl bg-midnight-plum/60 border border-lavender-spark/20 space-y-2 animate-fade-in">
            <label className="block text-xs font-medium text-ash-veil">
              Custom Hex Color Accent
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Color picker"
                value={(() => {
                  const val = formData.customColor?.trim();
                  if (!val) return '#1E40AF';
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) return val;
                  if (/^#[0-9A-Fa-f]{3}$/.test(val)) {
                    return `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`;
                  }
                  return '#1E40AF';
                })()}
                onChange={(e) => updateField('customColor', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-fog-line/20 bg-transparent p-0 flex-shrink-0"
              />
              <input
                type="text"
                placeholder="#1E40AF"
                value={formData.customColor || ''}
                onChange={(e) => updateField('customColor', e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-midnight-plum border border-fog-line/15 text-bone-white font-mono placeholder-mid-ash text-sm focus:outline-none focus:ring-2 focus:ring-lavender-spark/40 focus:border-lavender-spark/50 transition-all"
              />
            </div>
          </div>
        )}

        {/* Custom Title Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-ash-veil">
            Custom Certificate Title (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. DIPLOMA, CERTIFICATE OF EXCELLENCE"
            value={formData.customTitle || ''}
            onChange={(e) => updateField('customTitle', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-midnight-plum border border-fog-line/15 text-bone-white placeholder-mid-ash text-sm focus:outline-none focus:ring-2 focus:ring-lavender-spark/40 focus:border-lavender-spark/50 transition-all duration-200"
          />
          <p className="text-[11px] text-mid-ash">
            Optional custom headline for the certificate (e.g. &quot;HONORARY DIPLOMA&quot;, &quot;CERTIFICATE OF ACHIEVEMENT&quot;)
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-5 border-t border-fog-line/10">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="text-xs">
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading} className="flex-1 text-xs shadow-glow-green/30 gap-1.5">
          <span>Mint Certificate (Spore DOB)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </form>
  );
}
