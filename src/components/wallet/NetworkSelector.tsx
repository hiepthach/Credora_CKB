'use client';

import { useState, useRef, useEffect } from 'react';
import { useNetwork, Network } from '@/hooks/useNetwork';
import { Globe, ChevronDown, Check, AlertTriangle } from 'lucide-react';

const NETWORK_CONFIG = {
  testnet: {
    label: 'Testnet',
    description: 'Nervos test network',
    color: 'text-lavender-spark',
    bgColor: 'bg-lavender-spark/15',
    borderColor: 'border-lavender-spark/30',
  },
  mainnet: {
    label: 'Mainnet',
    description: 'CKB production network',
    color: 'text-signal-green',
    bgColor: 'bg-signal-green/15',
    borderColor: 'border-signal-green/30',
  },
};

interface NetworkSelectorProps {
  className?: string;
}

export function NetworkSelector({ className = '' }: NetworkSelectorProps) {
  const { network, setNetwork } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentConfig = NETWORK_CONFIG[network];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNetworkSelect = (newNetwork: Network) => {
    setNetwork(newNetwork);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 text-xs font-medium
          ${isOpen
            ? 'bg-shadow-plum border-lavender-spark/50 text-bone-white shadow-[0_0_12px_rgba(124,58,237,0.2)] dark:shadow-[0_0_15px_rgba(185,151,255,0.2)]'
            : 'bg-shadow-plum/70 border-fog-line/15 text-ash-veil hover:text-bone-white hover:border-lavender-spark/40 hover:shadow-[0_0_12px_rgba(124,58,237,0.2)] dark:hover:shadow-[0_0_15px_rgba(185,151,255,0.2)]'
          }
        `}
      >
        <div className="relative flex h-2 w-2">
          <span className={`animate-ping-slow absolute inline-flex h-full w-full rounded-full opacity-75 ${network === 'mainnet' ? 'bg-signal-green' : 'bg-lavender-spark'}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${network === 'mainnet' ? 'bg-signal-green' : 'bg-lavender-spark'}`} />
        </div>
        <span className="text-xs font-medium hidden sm:inline text-bone-white">
          {currentConfig.label}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-mid-ash transition-transform duration-200 ${isOpen ? 'rotate-180 text-bone-white' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-shadow-plum border border-fog-line/15 rounded-2xl shadow-screenshot-frame z-50 overflow-hidden animate-fade-in-scale">
          <div className="px-4 py-3 border-b border-fog-line/10">
            <p className="text-[11px] text-mid-ash uppercase tracking-wider font-semibold">Select Network</p>
          </div>
          <div className="p-2 space-y-1">
            {(Object.keys(NETWORK_CONFIG) as Network[]).map((net) => {
              const config = NETWORK_CONFIG[net];
              const isSelected = net === network;

              return (
                <button
                  key={net}
                  onClick={() => handleNetworkSelect(net)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isSelected
                      ? 'bg-midnight-plum text-bone-white border border-lavender-spark/30 shadow-sm'
                      : 'text-ash-veil hover:text-bone-white hover:bg-midnight-plum/50 border border-transparent'
                    }
                  `}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${config.bgColor} ${isSelected ? config.borderColor : 'border-fog-line/15'}`}>
                    <Globe className={`w-4 h-4 ${config.color}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-bone-white">{config.label}</p>
                    <p className="text-xs text-mid-ash">{config.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected && <Check className="w-4 h-4 text-signal-green" />}
                    {net === 'mainnet' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-signal-green/10 dark:bg-signal-green/15 text-signal-green font-semibold border border-signal-green/30 tracking-wide">
                        LIVE
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Warning for mainnet */}
          {network === 'mainnet' && (
            <div className="mx-3 mb-3 p-2.5 bg-amber-500/10 dark:bg-ember-orange/15 border border-amber-500/30 dark:border-ember-orange/30 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-ember-orange mt-0.5 flex-shrink-0" strokeWidth={1.5} />
              <p className="text-xs text-amber-950 dark:text-orange-200 leading-relaxed">
                You are connected to mainnet. Real CKB transactions will occur.
              </p>
            </div>
          )}

          <div className="p-2.5 border-t border-fog-line/10 bg-midnight-plum/40">
            <p className="text-[11px] text-mid-ash text-center">
              Network state persists automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function NetworkBadge() {
  const { network } = useNetwork();
  const config = NETWORK_CONFIG[network];

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bgColor} border ${config.borderColor}`}>
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping-slow absolute inline-flex h-full w-full rounded-full opacity-75 ${network === 'mainnet' ? 'bg-signal-green' : 'bg-lavender-spark'}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${network === 'mainnet' ? 'bg-signal-green' : 'bg-lavender-spark'}`} />
      </span>
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}

export function NetworkStatusDot() {
  const { network } = useNetwork();
  const config = NETWORK_CONFIG[network];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${network === 'mainnet' ? 'bg-signal-green' : 'bg-lavender-spark'} animate-pulse`} />
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}

