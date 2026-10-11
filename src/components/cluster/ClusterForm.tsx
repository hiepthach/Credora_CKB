'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import type { ClusterConfig } from '@/types';
import { useWallet } from '@/hooks/useWallet';

interface ClusterFormProps {
  initialValues?: Partial<ClusterConfig>;
  onSubmit: (data: ClusterConfig) => void;
  onCancel?: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

export function ClusterForm({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
}: ClusterFormProps) {
  const { issuerDids = [] } = useWallet();
  const [name, setName] = useState(initialValues.name || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialValues.websiteUrl || '');
  const [contactEmail, setContactEmail] = useState(initialValues.contactEmail || '');
  const [issuerDid, setIssuerDid] = useState(initialValues.issuerDid || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (websiteUrl && !isValidUrl(websiteUrl)) {
      newErrors.websiteUrl = 'Invalid URL format';
    }

    if (contactEmail && !isValidEmail(contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      websiteUrl: websiteUrl.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      issuerDid: issuerDid.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Organization / Academy Name"
        placeholder="e.g., CKB Blockchain Academy"
        value={name}
        onChange={setName}
        error={errors.name}
        required
        maxLength={100}
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-ash-veil">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your organization, accredited programs, and certification credentials..."
          rows={3}
          className="w-full px-3.5 py-2.5 rounded-xl bg-midnight-plum border border-fog-line/15 text-bone-white placeholder-mid-ash text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lavender-spark/40 focus:border-lavender-spark/50 resize-none"
          maxLength={500}
        />
        <div className="flex justify-between text-xs">
          {errors.description ? (
            <p className="text-red-400">{errors.description}</p>
          ) : (
            <span />
          )}
          <span className="text-mid-ash font-mono">{description.length}/500</span>
        </div>
      </div>

      <Input
        label="Website URL"
        type="url"
        placeholder="https://academy.nervos.org"
        value={websiteUrl}
        onChange={setWebsiteUrl}
        error={errors.websiteUrl}
      />

      <Input
        label="Contact Email"
        type="email"
        placeholder="certifications@academy.org"
        value={contactEmail}
        onChange={setContactEmail}
        error={errors.contactEmail}
      />

      {issuerDids.length > 0 ? (
        <div className="space-y-1.5 p-3.5 rounded-xl bg-midnight-plum/60 border border-fog-line/15">
          <label htmlFor="clusterIssuerDid" className="block text-xs font-medium text-ash-veil">
            Associated Issuer DID (Optional)
          </label>
          <select
            id="clusterIssuerDid"
            aria-label="Associated Issuer DID"
            value={issuerDid}
            onChange={(e) => setIssuerDid(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-midnight border border-fog-line/20 text-bone-white font-mono text-xs focus:ring-2 focus:ring-lavender-spark/40 focus:outline-none"
          >
            <option value="">None (Standard Spore Cluster)</option>
            {issuerDids.map((did) => (
              <option key={did} value={did}>
                {did}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-mid-ash">
            Bind this course to a registered CKB DID. Certificates issued in this cluster will inherit this authority identity.
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-mid-ash italic">
          Tip: If your wallet owns a did:ckb on Vellum, you can bind it to this institution to enable automatic Vellum reputation indexing.
        </p>
      )}

      <div className="flex gap-3 pt-4 border-t border-fog-line/10">
        <Button type="button" variant="secondary" onClick={onCancel} className="text-xs">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1 text-xs shadow-glow-green/30">
          {mode === 'create' ? 'Register Institution (On-Chain)' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

// Validation helpers
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

