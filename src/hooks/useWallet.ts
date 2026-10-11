'use client';

import { useState, useEffect } from 'react';
import { useCcc } from '@ckb-ccc/connector-react';
import type { ccc } from '@ckb-ccc/core';
import { findIssuerDid, listIssuerDids } from '@/lib/did';

export function useWallet() {
  const { open, close, disconnect, client, signerInfo, wallet } = useCcc();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [issuerDid, setIssuerDid] = useState<string | null>(null);
  const [issuerDids, setIssuerDids] = useState<string[]>([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingIssuerDid, setIsLoadingIssuerDid] = useState(false);
  const [isLoadingIssuerDids, setIsLoadingIssuerDids] = useState(false);

  const signer = signerInfo?.signer;

  useEffect(() => {
    let isCancelled = false;

    if (!signer) {
      setAddress(null);
      setBalance(null);
      setIssuerDid(null);
      setIssuerDids([]);
      setIsLoadingAddress(false);
      setIsLoadingIssuerDid(false);
      setIsLoadingIssuerDids(false);
      return;
    }

    const loadAddressAndBalance = async () => {
      setIsLoadingAddress(true);
      setIsLoadingIssuerDid(true);
      setIsLoadingIssuerDids(true);
      try {
        const [addr, detectedDid, detectedDids] = await Promise.all([
          signer.getRecommendedAddress(),
          Promise.resolve(findIssuerDid(signer)).catch((err) => {
            console.warn('Failed to detect issuer DID:', err);
            return null;
          }),
          Promise.resolve(listIssuerDids(signer)).catch((err) => {
            console.warn('Failed to detect issuer DIDs:', err);
            return [];
          }),
        ]);

        if (!isCancelled) {
          const finalDids =
            detectedDids && detectedDids.length > 0
              ? detectedDids
              : detectedDid
              ? [detectedDid]
              : [];
          const finalDid = detectedDid || (finalDids.length > 0 ? finalDids[0] : null);

          setAddress(addr);
          setIssuerDid(finalDid);
          setIssuerDids(finalDids);

          if (client && addr) {
            try {
              const balanceResult = await client.getBalance(
                addr as unknown as Parameters<typeof client.getBalance>[0]
              );
              if (!isCancelled) {
                setBalance(balanceResult);
              }
            } catch (err) {
              console.error('Failed to fetch balance:', err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to get recommended address from signer:', err);
        if (!isCancelled) {
          setAddress(null);
          setIssuerDid(null);
          setIssuerDids([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingAddress(false);
          setIsLoadingIssuerDid(false);
          setIsLoadingIssuerDids(false);
        }
      }
    };

    loadAddressAndBalance();

    return () => {
      isCancelled = true;
    };
  }, [signer, client]);

  return {
    address,
    signer,
    signerInfo,
    wallet,
    // Use signer presence as connection indicator, not just address
    // This prevents "Wallet Not Connected" flash when wallet is connected but address is still loading
    isConnected: !!signer,
    isLoadingAddress,
    issuerDid,
    issuerDids,
    isLoadingIssuerDid,
    isLoadingIssuerDids,
    disconnect,
    open,
    close,
    client,
    balance,
  };
}

