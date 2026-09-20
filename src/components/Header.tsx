'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui';
import { CredoraLogo } from '@/components/ui/CredoraLogo';
import { Wallet, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NetworkSelector } from './wallet/NetworkSelector';
import { AccountMenu } from './wallet/AccountMenu';
import { ThemeToggle } from './theme/ThemeToggle';

export function Header() {
  const pathname = usePathname();
  const { open, isConnected, address } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/clusters', label: 'Institutions' },
    { href: '/certificates/issue', label: 'Issue Certificates' },
    { href: '/certificates', label: 'My Certificates' },
    { href: '/verify', label: 'Verify' },
  ];

  return (
    <div className="sticky top-0 z-40 w-full pt-3 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Doppler Glass Header Nav — midnight plum with frosted blur & hairline border */}
        <header className="relative bg-midnight-plum/85 backdrop-blur-xl border border-fog-line/10 rounded-2xl shadow-glow-sm flex items-center justify-between px-4 sm:px-6 py-1.5 sm:py-2 transition-all duration-300">
          {/* Left: Credora Logo Lockup */}
          <div className="flex items-center gap-7">
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <CredoraLogo size={40} className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_0_14px_rgba(185,151,255,0.4)]" />
              <span className="text-lg font-bold text-bone-white tracking-tight">
                Credora
              </span>
            </Link>

            {/* Center: Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : item.href === '/certificates'
                    ? pathname === '/certificates' ||
                      (pathname.startsWith('/certificates/') && !pathname.startsWith('/certificates/issue'))
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-1.5 text-sm rounded-xl font-medium transition-all duration-200 border ${
                      isActive
                        ? 'text-lavender-spark bg-lavender-spark/10 border-lavender-spark/30 shadow-[0_0_12px_rgba(124,58,237,0.18)] dark:bg-shadow-plum dark:text-lavender-spark dark:border-lavender-spark/40 dark:shadow-[0_0_16px_rgba(185,151,255,0.2)] font-semibold'
                        : 'border-transparent text-ash-veil hover:text-bone-white hover:bg-shadow-plum/80 hover:border-lavender-spark/30 hover:shadow-[0_0_12px_rgba(124,58,237,0.2)] dark:hover:shadow-[0_0_15px_rgba(185,151,255,0.2)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Theme Toggle + Network Selector + Wallet Account Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Network Selector */}
            <NetworkSelector />

            {/* Wallet Connection / Account Menu */}
            {isConnected && address ? (
              <AccountMenu />
            ) : (
              <Button
                onClick={open}
                size="sm"
                className="gap-1.5 shadow-glow-green/30 hover:shadow-[0_0_16px_rgba(0,135,68,0.35)] dark:hover:shadow-[0_0_20px_rgba(0,245,117,0.5)]"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Connect</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-ash-veil hover:text-bone-white transition-all duration-200 rounded-xl hover:bg-shadow-plum hover:border-lavender-spark/40 hover:shadow-[0_0_12px_rgba(124,58,237,0.2)] dark:hover:shadow-[0_0_15px_rgba(185,151,255,0.2)] border border-transparent"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <nav className="absolute top-full left-0 right-0 mt-2 bg-shadow-plum border border-fog-line/15 rounded-2xl shadow-screenshot-frame p-3 flex flex-col gap-1.5 md:hidden animate-fade-in-scale z-50">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : item.href === '/certificates'
                    ? pathname === '/certificates' ||
                      (pathname.startsWith('/certificates/') && !pathname.startsWith('/certificates/issue'))
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3.5 py-2.5 text-sm rounded-xl transition-all duration-200 font-medium border ${
                      isActive
                        ? 'text-lavender-spark bg-lavender-spark/10 border-lavender-spark/30 shadow-[0_0_12px_rgba(124,58,237,0.15)] font-semibold dark:bg-midnight-plum dark:text-lavender-spark dark:border-lavender-spark/40'
                        : 'border-transparent text-ash-veil hover:text-bone-white hover:bg-midnight-plum/50 hover:border-lavender-spark/20 hover:shadow-[0_0_10px_rgba(124,58,237,0.15)]'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-2 mt-1 border-t border-fog-line/10 flex items-center justify-between px-3.5 py-1.5">
                <span className="text-xs text-ash-veil font-medium">Theme</span>
                <ThemeToggle />
              </div>
            </nav>
          )}
        </header>
      </div>
    </div>
  );
}
