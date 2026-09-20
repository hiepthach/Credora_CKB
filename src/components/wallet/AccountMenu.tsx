'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { ChevronDown, Copy, Check, ExternalLink, LogOut } from 'lucide-react';

interface AccountMenuProps {
  className?: string;
}

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function AccountMenu({ className = '' }: AccountMenuProps) {
  const { address, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!address) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerLink = () => {
    const explorers: Record<string, string | null> = {
      testnet: 'https://testnet.explorer.nervos.org',
      mainnet: 'https://explorer.nervos.org',
    };
    const baseUrl = explorers[process.env.NEXT_PUBLIC_NETWORK || 'testnet'] || explorers.testnet;
    return `${baseUrl}/address/${address}`;
  };

  const explorerUrl = getExplorerLink();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Account menu"
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 text-xs font-medium group
          ${isOpen
            ? 'bg-shadow-plum border-lavender-spark/50 text-bone-white shadow-[0_0_12px_rgba(124,58,237,0.2)] dark:shadow-[0_0_15px_rgba(185,151,255,0.2)]'
            : 'bg-shadow-plum/70 border-fog-line/15 text-ash-veil hover:text-bone-white hover:border-lavender-spark/40 hover:shadow-[0_0_12px_rgba(124,58,237,0.2)] dark:hover:shadow-[0_0_15px_rgba(185,151,255,0.2)]'
          }
        `}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-signal-green shadow-[0_0_8px_rgba(0,245,117,0.5)]" />
        <span className="font-mono text-xs text-bone-white">
          {truncateAddress(address)}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-mid-ash transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-bone-white' : 'group-hover:text-bone-white'
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-shadow-plum border border-fog-line/15 rounded-2xl shadow-screenshot-frame z-50 overflow-hidden animate-fade-in-scale">
          {/* Header: Wallet Status & Copyable Address */}
          <div className="p-3.5 border-b border-fog-line/10 bg-midnight-plum/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-mid-ash uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-signal-green" />
                Connected Wallet
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-lavender-spark hover:text-bone-white px-2 py-0.5 rounded-md hover:bg-shadow-plum transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-signal-green animate-fade-in" />
                    <span className="text-signal-green font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-xs text-bone-white break-all bg-shadow-plum/80 px-2.5 py-1.5 rounded-lg border border-fog-line/10 select-all">
              {address}
            </p>
          </div>

          {/* Action Items */}
          <div className="p-1.5 space-y-0.5">
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-ash-veil hover:text-bone-white hover:bg-midnight-plum/60 rounded-xl transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-mid-ash" />
                <span>View on CKB Explorer</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                disconnect();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

