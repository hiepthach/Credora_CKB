'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useIssuerClusters } from '@/hooks/useIssuerClusters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Modal, Spinner } from '@/components/ui';
import { CredoraLogo } from '@/components/ui/CredoraLogo';
import {
  CertificateForm,
  type CertificateData,
  PaperCertificate,
  InstitutionSelector,
} from '@/components/certificate';
import { BatchIssueSection } from '@/components/batch';
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Wallet,
  Award,
  Layers,
} from 'lucide-react';
import type { Cluster, CertificateDNA, CertificateLayout, CertificateTheme } from '@/types';
import { getCluster, issueCertificate } from '@/lib/credentials';
import { getTransactionUrl } from '@/lib/ckb';
import { cn } from '@/utils';

function IssuePageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { signer, address, isLoadingAddress, open } = useWallet();
  const { clusters, isLoading: isLoadingClusters } = useIssuerClusters();

  const clusterIdParam = searchParams.get('cluster');
  const tabParam = searchParams.get('tab');
  const queryLayout = searchParams.get('layout') as CertificateLayout | null;
  const queryTheme = searchParams.get('theme') as CertificateTheme | null;

  const [activeTab, setActiveTab] = useState<'single' | 'batch'>(
    tabParam === 'batch' ? 'batch' : 'single'
  );
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(clusterIdParam);
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [result, setResult] = useState<{ certificateId: string; transactionHash: string } | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Sync activeTab with URL tabParam
  useEffect(() => {
    if (tabParam === 'batch') {
      setActiveTab('batch');
    } else if (tabParam === 'single') {
      setActiveTab('single');
    }
  }, [tabParam]);

  // Auto-select first institution if none is selected
  useEffect(() => {
    if (clusterIdParam) {
      setSelectedClusterId(clusterIdParam);
    } else if (!selectedClusterId && clusters.length > 0) {
      const firstId = clusters[0].clusterId || clusters[0].id;
      if (firstId) {
        setSelectedClusterId(firstId);
      }
    }
  }, [clusterIdParam, clusters, selectedClusterId]);

  const activeClusterId = clusterIdParam || selectedClusterId;

  // Load cluster metadata when selection changes
  useEffect(() => {
    if (activeClusterId) {
      getCluster(activeClusterId)
        .then(setCluster)
        .catch((err) => {
          console.error('Failed to load cluster:', err);
          setCluster(null);
        });
    } else {
      setCluster(null);
    }
  }, [activeClusterId]);

  const handleTabChange = (newTab: 'single' | 'batch') => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.replace(`/certificates/issue?${params.toString()}`);
  };

  const handleClusterChange = (newClusterId: string | null) => {
    setSelectedClusterId(newClusterId);
    const params = new URLSearchParams(searchParams.toString());
    if (newClusterId) {
      params.set('cluster', newClusterId);
    } else {
      params.delete('cluster');
    }
    router.replace(`/certificates/issue?${params.toString()}`);
  };

  // Live preview form state
  const [liveFormData, setLiveFormData] = useState<CertificateData>({
    recipientAddress: '',
    recipientName: '',
    courseName: '',
    completionDate: new Date().toISOString().split('T')[0],
    layout: queryLayout || 'classic',
    theme: queryTheme || 'blue',
    customColor: '#1E40AF',
    customTitle: '',
  });

  const previewCertificate: CertificateDNA = useMemo(() => {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://schema.org',
      ],
      id: '0x0000000000000000000000000000000000000000000000000000000000000000',
      type: ['VerifiableCredential', 'CourseCertificate'],
      issuer: {
        id: activeClusterId || 'ckt1qcluster',
        name: cluster?.name || 'Certificate Authority',
        description: cluster?.description,
      },
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: liveFormData.recipientAddress || address || 'ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv',
        type: 'CourseCertificate',
        name: liveFormData.recipientName || 'Jane Doe',
        courseName: liveFormData.courseName || 'Certified CKB & DOB Developer',
        completionDate: liveFormData.completionDate || new Date().toISOString().split('T')[0],
        grade: liveFormData.grade,
        score: liveFormData.score,
        skills: liveFormData.skills && liveFormData.skills.length > 0 ? liveFormData.skills : undefined,
        issuerName: cluster?.name || 'Certificate Authority',
        metadata: {
          layout: liveFormData.layout,
          theme: liveFormData.theme,
          customColor: liveFormData.customColor,
          customTitle: liveFormData.customTitle,
        },
      },
    };
  }, [liveFormData, cluster, activeClusterId, address]);

  const issueMutation = useMutation({
    mutationFn: async (data: CertificateData) => {
      if (!signer || !activeClusterId || !cluster) {
        throw new Error('Missing required parameters');
      }
      return issueCertificate({
        signer,
        clusterId: activeClusterId,
        issuerName: cluster.name,
        issuerDescription: cluster.description,
        subject: {
          id: data.recipientAddress,
          type: 'CourseCertificate',
          name: data.recipientName,
          courseName: data.courseName,
          completionDate: data.completionDate,
          grade: data.grade,
          score: data.score,
          skills: data.skills,
          metadata: {
            layout: data.layout,
            theme: data.theme,
            customColor: data.customColor,
            customTitle: data.customTitle,
          },
        },
        expirationDate: data.expirationDate,
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['certificates'] });
      await queryClient.invalidateQueries({ queryKey: ['clusters'] });
      setResult(data);
      setShowSuccessModal(true);
    },
  });

  if (isLoadingAddress || isLoadingClusters) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Loading workspace..." />
      </div>
    );
  }

  if (!address || !signer) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Card variant="default" padding="xl" className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-shadow-plum/80 border border-lavender-spark/30 rounded-2xl flex items-center justify-center shadow-glow-violet/30 animate-float">
            <Wallet className="w-8 h-8 text-lavender-spark drop-shadow-[0_0_12px_rgba(185,151,255,0.6)]" />
          </div>
          <h2 className="text-xl font-bold text-bone-white tracking-tight">Wallet Not Connected</h2>
          <p className="text-sm text-ash-veil leading-relaxed">
            Connect your wallet to issue verifiable certificates on Nervos CKB.
          </p>
          <div className="pt-2">
            <Button onClick={() => open()} className="gap-2 shadow-glow-green/30">
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </Button>
          </div>
          <p className="text-xs text-mid-ash pt-2 border-t border-fog-line/10">
            Supported wallets: JoyID Passkeys, MetaMask, WalletConnect
          </p>
        </Card>
      </div>
    );
  }

  if (clusters.length === 0 && !activeClusterId) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="pb-6 border-b border-fog-line/10">
          <div className="flex items-center gap-2 mb-1">
            <CredoraLogo size={14} className="inline-block" />
            <span className="text-xs font-mono text-mid-ash uppercase tracking-wider">Certificate Issuance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-bone-white tracking-tight">Issue Certificates</h1>
          <p className="text-sm text-ash-veil mt-1">
            Mint immutable Spore DOB credentials directly to students&apos; CKB addresses
          </p>
        </div>

        <Card variant="default" padding="xl" className="max-w-md mx-auto text-center space-y-4 py-12">
          <div className="w-16 h-16 mx-auto bg-midnight-plum border border-lavender-spark/30 rounded-2xl flex items-center justify-center text-3xl shadow-glow-violet/30 animate-float">
            🏛️
          </div>
          <h2 className="text-xl font-bold text-bone-white tracking-tight">No Registered Institutions</h2>
          <p className="text-sm text-ash-veil leading-relaxed">
            You need an accredited issuing institution on CKB to issue certificates. Register your institution on-chain to get started.
          </p>
          <Button onClick={() => router.push('/clusters')} className="text-xs shadow-glow-green/30">
            Register Institution Now →
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="pb-6 border-b border-fog-line/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CredoraLogo size={14} className="inline-block" />
            <span className="text-xs font-mono text-mid-ash uppercase tracking-wider">Certificate Issuance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-bone-white tracking-tight">Issue Certificates</h1>
          <p className="text-sm text-ash-veil mt-1">
            Mint immutable Spore DOB credentials directly to students&apos; CKB addresses
          </p>
        </div>

        {/* Mobile preview toggle button (only on single tab) */}
        {activeTab === 'single' && (
          <div className="lg:hidden flex items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="text-xs gap-1.5 w-full sm:w-auto justify-center"
            >
              {showMobilePreview ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Hide Live Preview</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-lavender-spark" />
                  <span>Preview Certificate</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Unified Control Bar: Institution Selector + Sub-Tabs */}
      <div className="p-4 bg-midnight-plum/70 rounded-2xl border border-fog-line/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Institution Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 max-w-xl">
          <div className="min-w-[130px]">
            <span className="text-xs font-mono uppercase tracking-wider text-mid-ash font-semibold block">
              Issuing Institution
            </span>
          </div>
          <div className="flex-1">
            <InstitutionSelector
              value={activeClusterId}
              onChange={handleClusterChange}
            />
          </div>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center justify-start md:justify-end">
          <div className="inline-flex rounded-xl bg-midnight p-1 border border-fog-line/15">
            <button
              type="button"
              onClick={() => handleTabChange('single')}
              className={cn(
                'px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer',
                activeTab === 'single'
                  ? 'bg-lavender-spark text-midnight-plum shadow-glow-violet/30 font-bold'
                  : 'text-ash-veil hover:text-bone-white hover:bg-white/5'
              )}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Single Certificate</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('batch')}
              className={cn(
                'px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer',
                activeTab === 'batch'
                  ? 'bg-lavender-spark text-midnight-plum shadow-glow-violet/30 font-bold'
                  : 'text-ash-veil hover:text-bone-white hover:bg-white/5'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Issuance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {cluster ? (
        <>
          {activeTab === 'single' && (
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
              {/* Form Column */}
              <div className="lg:col-span-7 space-y-6">
                <Card variant="default" padding="xl">
                  <CertificateForm
                    clusterId={activeClusterId || ''}
                    clusterName={cluster.name}
                    defaultLayout={queryLayout || 'classic'}
                    defaultTheme={queryTheme || 'blue'}
                    onChange={setLiveFormData}
                    onSubmit={(data) => issueMutation.mutate(data)}
                    onCancel={() => router.back()}
                    loading={issueMutation.isPending}
                  />
                </Card>

                {issueMutation.isError && (
                  <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-xl">
                    <p className="text-sm text-red-400">
                      Failed to issue certificate: {issueMutation.error?.message || 'Unknown error'}
                    </p>
                    {(issueMutation.error?.message || '').includes('faucet') && (
                      <a
                        href="https://faucet.nervos.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-lavender-spark hover:underline"
                      >
                        Get free testnet CKB →
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Live Preview Column (Sticky on Desktop, Toggleable on Mobile) */}
              <div
                className={`lg:col-span-5 space-y-4 lg:sticky lg:top-8 ${
                  showMobilePreview ? 'block mt-6 lg:mt-0' : 'hidden lg:block'
                }`}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-lavender-spark" />
                    <h3 className="text-xs font-semibold text-bone-white uppercase tracking-wider">
                      Live Certificate Preview
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
                    layout={liveFormData.layout}
                    theme={liveFormData.theme}
                    customColor={liveFormData.customColor}
                    customTitle={liveFormData.customTitle}
                    className="transform scale-100 origin-top"
                  />
                </div>

                <div className="p-3 bg-midnight-plum/20 rounded-xl border border-fog-line/10 text-[11px] text-mid-ash flex items-center justify-between">
                  <span>Theme: <strong className="text-bone-white capitalize">{liveFormData.theme || 'Blue'}</strong></span>
                  <span>Layout: <strong className="text-bone-white capitalize">{liveFormData.layout || 'Classic'}</strong></span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'batch' && (
            <BatchIssueSection
              clusterId={activeClusterId || ''}
              cluster={cluster}
              signer={signer}
              onNavigateToCertificates={() => router.push('/certificates')}
            />
          )}
        </>
      ) : (
        <div className="flex justify-center py-16">
          <Spinner label="Loading institution details..." />
        </div>
      )}

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push('/certificates');
        }}
        title="Certificate Minted On CKB!"
        size="md"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 mx-auto bg-midnight-plum border border-signal-green/40 rounded-2xl flex items-center justify-center text-signal-green shadow-glow-green/30 animate-float">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-bone-white tracking-tight">
              Certificate Minted Successfully!
            </h2>
            <p className="text-sm text-ash-veil mt-1 leading-relaxed">
              Your credential has been converted into a Spore DOB cell and stored permanently on the Nervos CKB blockchain.
            </p>
          </div>

          {result && (
            <div className="p-4 bg-midnight-plum rounded-xl text-left space-y-2.5 border border-fog-line/10 text-xs">
              <div>
                <p className="text-mid-ash uppercase tracking-wider font-semibold">Certificate ID</p>
                <p className="font-mono text-bone-white break-all mt-0.5 bg-shadow-plum/50 p-2 rounded-lg border border-fog-line/10">
                  {result.certificateId}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-mid-ash uppercase tracking-wider font-semibold">Transaction Hash</p>
                  <a
                    href={getTransactionUrl(result.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-lavender-spark hover:underline flex items-center gap-1"
                  >
                    View on CKB Explorer
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="font-mono text-bone-white break-all mt-0.5 bg-shadow-plum/50 p-2 rounded-lg border border-fog-line/10">
                  {result.transactionHash}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowSuccessModal(false);
                setResult(null);
              }}
              className="flex-1 text-xs"
            >
              Issue Another
            </Button>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/certificates');
              }}
              className="flex-1 text-xs shadow-glow-green/30"
            >
              View Certificates →
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function IssuePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Spinner /></div>}>
      <IssuePageContent />
    </Suspense>
  );
}
