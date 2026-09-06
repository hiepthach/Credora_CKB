'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Spinner, Badge } from '@/components/ui';
import { CredoraLogo } from '@/components/ui/CredoraLogo';
import { CertificateList, CertificateDetail } from '@/components/certificate';
import type { CertificateDNA } from '@/types';
import {
  getHolderCertificates,
  getAllCertificates,
  getProviderClusters,
  meltCertificate,
  getCertificate,
} from '@/lib/credentials';
import { ArrowLeft, Wallet, RefreshCw, Sparkles, Filter } from 'lucide-react';
import { listDidCkbsByLock } from '@ckb-ccc/did-ckb';
import { ccc } from '@ckb-ccc/core';

interface CertificateWithMeta {
  certificate: CertificateDNA;
  certificateId: string;
  transactionHash?: string;
  clusterId?: string;
}

function CertificatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const certIdParam = searchParams.get('id');

  const queryClient = useQueryClient();
  const { signer, address, client, isConnected, isLoadingAddress, open } = useWallet();
  const [selectedCert, setSelectedCert] = useState<CertificateWithMeta | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'received' | 'issued'>('all');
  const [shareResult, setShareResult] = useState<{ message: string; success: boolean } | null>(null);
  const [meltingCertId, setMeltingCertId] = useState<string | null>(null);
  const [meltError, setMeltError] = useState<string | null>(null);
  const [userDids, setUserDids] = useState<string[]>([]);

  // Fetch user's DIDs when address changes
  useEffect(() => {
    if (!address || !client) {
      setUserDids([]);
      return;
    }

    const fetchUserDids = async () => {
      try {
        const addr = await ccc.Address.fromString(address, client);
        const dids = await listDidCkbsByLock({ client, lock: addr.script });
        setUserDids(dids.map((d) => d.did));
      } catch {
        // User has no DIDs - that's fine
        setUserDids([]);
      }
    };

    fetchUserDids();
  }, [address, client]);

  const { data: rawCertificates = [], isLoading, refetch, error } = useQuery({
    queryKey: ['certificates', address],
    queryFn: async () => {
      const allCerts = await getAllCertificates(client, address || undefined);
      return allCerts;
    },
    enabled: true,
  });

  const { data: userClusters = [] } = useQuery({
    queryKey: ['clusters', address],
    queryFn: async () => {
      return getProviderClusters(address || undefined, client);
    },
    enabled: true,
  });

  // Dedicated query to fetch individual certificate when navigating directly via ?id=...
  const { data: fetchedParamCert, isLoading: isLoadingParamCert } = useQuery({
    queryKey: ['certificate-by-id', certIdParam],
    queryFn: async () => {
      if (!certIdParam) return null;
      const foundInRaw = rawCertificates.find((c) => c.certificateId === certIdParam);
      if (foundInRaw) return foundInRaw;
      const fetched = await getCertificate(certIdParam, client);
      if (fetched && fetched.certificate) {
        return {
          certificate: fetched.certificate,
          certificateId: fetched.certificateId,
          transactionHash: fetched.transactionHash,
          clusterId: fetched.clusterId,
        } as CertificateWithMeta;
      }
      return null;
    },
    enabled: !!certIdParam,
  });

  const { receivedCerts, issuedCerts, allUserCerts, certificates } = useMemo(() => {
    const userClusterIds = new Set(
      userClusters.flatMap((c) => [
        c.clusterId,
        c.clusterId?.toLowerCase(),
        c.id,
        c.id?.toLowerCase(),
      ].filter(Boolean) as string[])
    );

    const isAddressMatch = (addr1?: string, addr2?: string): boolean => {
      if (!addr1 || !addr2) return false;
      // Use strict full equality - CKB addresses must match exactly
      return addr1.toLowerCase() === addr2.toLowerCase();
    };

    const checkIsRecipient = (c: CertificateWithMeta): boolean => {
      if (!address) return false;

      const subjectId = c.certificate?.credentialSubject?.id || '';
      if (!subjectId) return false;

      // Case 1: Direct address match (handles both old and new certificates)
      if (isAddressMatch(subjectId, address)) {
        return true;
      }

      // Case 2: DID match - check if user's DID matches the certificate's DID
      if (subjectId.startsWith('did:ckb:') && userDids.includes(subjectId)) {
        return true;
      }

      // Case 3: For DID-issued certificates, also check resolved address
      // (covers cases where credentialSubject.walletAddress matches)
      const walletAddr = c.certificate?.credentialSubject?.walletAddress;
      if (walletAddr && isAddressMatch(walletAddr, address)) {
        return true;
      }

      return false;
    };

    const checkIsIssuer = (c: CertificateWithMeta): boolean => {
      if (!address) return false;
      const issuerId = c.certificate?.issuer?.id || '';
      const clusterId = c.clusterId || '';

      // 1. Direct address match with issuer ID or cluster ID
      if (isAddressMatch(issuerId, address) || isAddressMatch(clusterId, address)) {
        return true;
      }

      // 2. Check against user's cluster IDs
      for (const ucid of Array.from(userClusterIds)) {
        if (isAddressMatch(ucid, issuerId) || isAddressMatch(ucid, clusterId)) {
          return true;
        }
      }

      return false;
    };

    const received: CertificateWithMeta[] = [];
    const issued: CertificateWithMeta[] = [];
    const allUser: CertificateWithMeta[] = [];

    // Single-pass partition
    for (const cert of rawCertificates) {
      const isRec = checkIsRecipient(cert);
      const isIss = checkIsIssuer(cert);

      if (isRec) received.push(cert);
      if (isIss) issued.push(cert);
      if (isRec || isIss) allUser.push(cert);
    }

    let activeList: CertificateWithMeta[] = [];
    if (filterMode === 'received') {
      activeList = received;
    } else if (filterMode === 'issued') {
      activeList = issued;
    } else {
      activeList = allUser;
    }

    return {
      receivedCerts: received,
      issuedCerts: issued,
      allUserCerts: allUser,
      certificates: activeList,
    };
  }, [rawCertificates, userClusters, address, filterMode, userDids]);

  const handleShare = async (cert: CertificateWithMeta) => {
    const { shareCertificate } = await import('@/lib/share');
    const result = await shareCertificate(cert.certificateId);
    setShareResult({ message: result.message, success: result.success });
    setTimeout(() => setShareResult(null), 3000);
  };

  const handleMelt = async (cert: CertificateWithMeta) => {
    if (!signer) {
      setMeltError('Wallet not connected');
      return;
    }
    try {
      setMeltError(null);
      setMeltingCertId(cert.certificateId);
      await meltCertificate(signer, cert.certificateId);
      await queryClient.invalidateQueries({ queryKey: ['certificates'] });
      await refetch();
      // Go back to list after melting
      setSelectedCert(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to melt certificate';
      setMeltError(message);
      throw error; // Re-throw so modal can handle loading state
    } finally {
      setMeltingCertId(null);
    }
  };

  // Derive active certificate from URL parameter or selected state
  const activeCert: CertificateWithMeta | null = useMemo(() => {
    if (certIdParam) {
      if (selectedCert?.certificateId === certIdParam) return selectedCert;
      const foundInRaw = rawCertificates.find((c) => c.certificateId === certIdParam);
      if (foundInRaw) return foundInRaw;
      if (fetchedParamCert) return fetchedParamCert;
    }
    return selectedCert;
  }, [certIdParam, selectedCert, rawCertificates, fetchedParamCert]);

  // If visiting directly with a cert ID, show loading spinner while fetching
  if (certIdParam && !activeCert && (isLoading || isLoadingParamCert)) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Loading certificate details..." />
      </div>
    );
  }

  // If cert ID was requested in URL but not found after loading
  if (certIdParam && !activeCert && !isLoading && !isLoadingParamCert) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Card variant="default" padding="xl" className="space-y-4">
          <p className="text-base font-semibold text-bone-white">Certificate Not Found</p>
          <p className="text-xs text-ash-veil leading-relaxed">
            Could not find a certificate matching ID:
            <br />
            <span className="font-mono text-bone-white break-all text-[11px] bg-shadow-plum/60 p-1.5 rounded inline-block mt-2">
              {certIdParam}
            </span>
          </p>
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={() => router.push('/certificates')}
              className="text-xs"
            >
              Back to Certificates
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoadingAddress && !certIdParam) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Resolving wallet address..." />
      </div>
    );
  }

  if (!address && !certIdParam) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Card variant="default" padding="xl" className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-shadow-plum/80 border border-lavender-spark/30 rounded-2xl flex items-center justify-center shadow-glow-violet/30 animate-float">
            <Wallet className="w-8 h-8 text-lavender-spark drop-shadow-[0_0_12px_rgba(185,151,255,0.6)]" />
          </div>
          <h2 className="text-xl font-bold text-bone-white tracking-tight">Wallet Not Connected</h2>
          <p className="text-sm text-ash-veil leading-relaxed">
            Connect your wallet to view your portable, verifiable Spore DOB certificates.
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

  if (activeCert) {
    const isIssuerOfSelected = issuedCerts.some(
      (c) => c.certificateId === activeCert.certificateId
    );

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between pb-4 border-b border-fog-line/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCert(null);
              router.push('/certificates');
            }}
            className="text-ash-veil hover:text-bone-white gap-2 border border-fog-line/15"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to certificates</span>
          </Button>
        </div>
        {shareResult && (
          <div
            className={`px-4 py-2 rounded-xl text-xs font-medium ${
              shareResult.success
                ? 'bg-signal-green/10 border border-signal-green/30 text-signal-green'
                : 'bg-red-950/40 border border-red-800/40 text-red-400'
            }`}
          >
            {shareResult.message}
          </div>
        )}
        {meltError && (
          <div className="px-4 py-2 rounded-xl text-xs font-medium bg-red-950/40 border border-red-800/40 text-red-400">
            {meltError}
          </div>
        )}
        <CertificateDetail
          certificate={activeCert.certificate}
          certificateId={activeCert.certificateId}
          transactionHash={activeCert.transactionHash}
          isIssuer={isIssuerOfSelected}
          onShare={() => handleShare(activeCert)}
          onMelt={() => handleMelt(activeCert)}
          melting={meltingCertId === activeCert.certificateId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-fog-line/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CredoraLogo size={14} className="inline-block" />
            <span className="text-xs font-mono text-mid-ash uppercase tracking-wider">Credential Vault</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-bone-white tracking-tight">My Certificates</h1>
          <p className="text-sm text-ash-veil mt-1">
            View, verify, and export your sovereign on-chain Spore DOB credentials
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex bg-midnight-plum p-1 rounded-xl border border-fog-line/10 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'all'
                  ? 'bg-shadow-plum text-bone-white font-medium border border-fog-line/20'
                  : 'text-mid-ash hover:text-bone-white'
              }`}
            >
              All ({allUserCerts.length})
            </button>
            <button
              onClick={() => setFilterMode('received')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'received'
                  ? 'bg-shadow-plum text-bone-white font-medium border border-fog-line/20'
                  : 'text-mid-ash hover:text-bone-white'
              }`}
            >
              Received ({receivedCerts.length})
            </button>
            <button
              onClick={() => setFilterMode('issued')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterMode === 'issued'
                  ? 'bg-shadow-plum text-bone-white font-medium border border-fog-line/20'
                  : 'text-mid-ash hover:text-bone-white'
              }`}
            >
              Issued by You ({issuedCerts.length})
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <CertificateList
        certificates={certificates}
        loading={isLoading}
        onSelect={(cert) => {
          setSelectedCert(cert);
          router.push(`/certificates?id=${encodeURIComponent(cert.certificateId)}`);
        }}
        onShare={handleShare}
        emptyTitle={
          filterMode === 'received'
            ? 'No received certificates'
            : filterMode === 'issued'
            ? 'No certificates issued yet'
            : 'No certificates found'
        }
        emptyDescription={
          filterMode === 'received'
            ? 'You have not received any verifiable certificates at this address yet.'
            : filterMode === 'issued'
            ? 'You have not issued any certificates from your clusters yet.'
            : 'Certificates issued to your address or minted by your clusters will appear here.'
        }
        emptyAction={filterMode === 'issued' ? () => router.push('/clusters') : undefined}
      />

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-xl">
          <p className="text-sm text-red-400">Failed to load certificates: {String(error)}</p>
        </div>
      )}
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Spinner label="Loading certificates..." />
        </div>
      }
    >
      <CertificatesContent />
    </Suspense>
  );
}


