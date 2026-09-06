import Link from 'next/link';
import React from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { CredoraLogo } from '@/components/ui/CredoraLogo';
import { Wallet, Shield, Award, Users, FileText, Zap, ArrowRight, CheckCircle2, Lock, Sparkles, Terminal, Copy } from 'lucide-react';

const features: Array<{
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
}> = [
  {
    icon: Shield,
    tag: 'W3C Standard',
    title: 'Verifiable Credentials',
    description: 'Cryptographically signed credentials anchored on Nervos CKB as tamper-proof Spore Digital Objects (DOBs).',
    href: '/verify',
  },
  {
    icon: Users,
    tag: 'Issuer Identity',
    title: 'Institution Management',
    description: 'Register accredited educational institutions and course providers as sovereign on-chain Spore Clusters.',
    href: '/clusters',
  },
  {
    icon: Award,
    tag: 'Spore Protocol',
    title: 'DOB Certificate Issuance',
    description: 'Mint immutable, portable diplomas to CKB addresses or did:ckb: identifiers. Certificates survive wallet rotations.',
    href: '/certificates/issue',
    badge: 'DID',
  },
  {
    icon: Zap,
    tag: 'Batch Engine',
    title: 'High-Throughput Issuance',
    description: 'Process hundreds of graduate certificates simultaneously via CSV or JSON with instant transaction batching.',
    href: '/certificates/issue?tab=batch',
  },
  {
    icon: FileText,
    tag: 'Visual Studio',
    title: 'Certificate Templates',
    description: 'Design custom visual layouts, badge metadata, and institution branding with live preview rendering.',
    href: '/certificates/issue',
  },
  {
    icon: Wallet,
    tag: 'OmniLock',
    title: 'Multi-Wallet Support',
    description: 'Seamless authentication for students and issuers via JoyID passkeys, MetaMask, and WalletConnect.',
    href: '/certificates',
  },
];

const architectureSteps = [
  {
    step: '01',
    icon: Wallet,
    label: 'OmniLock Auth',
    sublabel: 'Decentralized identity via passkey or Web3 wallet',
  },
  {
    step: '02',
    icon: Users,
    label: 'Spore Cluster',
    sublabel: 'Institution identity cell on CKB layer-1',
  },
  {
    step: '03',
    icon: Award,
    label: 'DOB Minting',
    sublabel: 'Certificate DNA stored in Spore Cell capacity',
  },
  {
    step: '04',
    icon: Shield,
    label: 'Zero-Trust Verify',
    sublabel: 'Instant cryptographic proof verification',
  },
];

export default function Home() {
  return (
    <div className="space-y-28 py-6 sm:py-10">
      {/* =========================================================
          HERO SECTION — Doppler Midnight Vault & Aurora Glow
          ========================================================= */}
      <section className="relative">
        {/* Background Aurora Breathing Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[850px] h-[450px] aurora-backdrop animate-aurora-breath -z-10" />

        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column (Headline + CTA) */}
          <div className="lg:col-span-7 space-y-7 text-left">
            {/* Eyebrow Label */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-shadow-plum border border-lavender-spark/30 shadow-glow-sm">
              <CredoraLogo size={14} className="inline-block" />
              <span className="text-xs font-medium text-bone-white tracking-wide">
                Nervos CKB · Spore DOB Protocol
              </span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-bold text-bone-white leading-[1.06] tracking-[-0.025em]">
              The tamper-proof <br />
              <span className="doppler-gradient-text">credential vault</span> <br />
              on blockchain.
            </h1>

            {/* Body Copy */}
            <p className="text-base sm:text-lg text-ash-veil max-w-xl leading-relaxed font-normal">
              Transform course completions and academic achievements into sovereign, verifiable certificates stored permanently on the Nervos CKB blockchain.
            </p>

            {/* Action CTA Cluster */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link href="/clusters">
                <Button size="lg" className="px-6 py-3.5 text-sm font-semibold gap-2 shadow-glow-green/30">
                  <span>Start Issuing</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/verify">
                <Button variant="secondary" size="lg" className="px-6 py-3.5 text-sm font-medium border border-fog-line/20">
                  <Shield className="w-4 h-4 text-ash-veil" />
                  <span>Verify Credential</span>
                </Button>
              </Link>
            </div>

            {/* Trust Metrics */}
            <div className="pt-6 border-t border-fog-line/10 flex flex-wrap items-center gap-8 text-xs text-mid-ash">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-signal-green" />
                <span>On-chain Spore Protocol</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-lavender-spark" />
                <span>W3C Verifiable Credentials</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-bone-white" />
                <span>JoyID Passkey Ready</span>
              </div>
            </div>
          </div>

          {/* Right Column (Interactive Doppler Security Console Frame) */}
          <div className="lg:col-span-5">
            <div className="doppler-vault-frame p-6 sm:p-7 relative transition-all duration-300 hover:shadow-[0_0_80px_rgba(185,151,255,0.22)] animate-fade-in-scale">
              {/* Console Header Bar */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-fog-line/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="text-xs font-mono text-mid-ash ml-2 flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-lavender-spark" />
                    vault.ckb.spore
                  </span>
                </div>
                <Badge variant="success" pulse>
                  LIVE ON CKB
                </Badge>
              </div>

              {/* Console Live Card Preview */}
              <div className="space-y-4 font-mono text-xs">
                {/* Active Cluster Chip */}
                <div className="p-3.5 bg-midnight-plum/90 rounded-xl border border-fog-line/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-shadow-plum border border-lavender-spark/30 flex items-center justify-center">
                      <CredoraLogo size={18} />
                    </div>
                    <div>
                      <p className="text-bone-white font-sans font-medium text-xs">CKB Blockchain Academy</p>
                      <p className="text-[11px] text-mid-ash">Cluster ID: 0x9a8f...21ce</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-signal-green px-2 py-0.5 rounded bg-signal-green/10 border border-signal-green/20">
                    Active Issuer
                  </span>
                </div>

                {/* Certificate Payload Box */}
                <div className="p-4 bg-midnight-plum/90 rounded-xl border border-fog-line/10 space-y-2.5 text-ash-veil">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-mid-ash">RECIPIENT</span>
                    <span className="text-bone-white font-sans font-medium">Satoshi Dev</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-mid-ash">COURSE</span>
                    <span className="text-lavender-spark font-sans font-medium">Advanced CKB-VM & DOBs</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-mid-ash">GRADE / SCORE</span>
                    <span className="text-signal-green font-bold">A+ · 98%</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-mid-ash">PROOF TYPE</span>
                    <span className="text-bone-white">Spore Cell DOB (182 CKB)</span>
                  </div>
                </div>

                {/* Live Verification Status Action */}
                <div className="p-3 bg-shadow-plum rounded-xl border border-signal-green/30 flex items-center justify-between shadow-glow-sm">
                  <div className="flex items-center gap-2 text-signal-green font-sans font-medium text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cryptographically Verified</span>
                  </div>
                  <span className="text-[11px] text-mid-ash font-mono">Block #12,840,119</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURE SECTION — Doppler 3-Column Card Grid (20px Radius)
          ========================================================= */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="lavender" className="mb-1">
            Engineered Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-bone-white tracking-tight">
            Why institutions choose Credora
          </h2>
          <p className="text-sm sm:text-base text-ash-veil leading-relaxed">
            Built from first principles on the Nervos Cell Model to deliver zero-trust digital credential verification.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group flex rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender-spark"
            >
              <Card
                variant="interactive"
                padding="lg"
                className="relative overflow-hidden flex flex-col justify-between w-full"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div>
                  {/* Header: Icon + Category Tag */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-midnight-plum border border-fog-line/15 group-hover:border-lavender-spark/40 flex items-center justify-center transition-colors duration-200">
                      <feature.icon className="w-5 h-5 text-bone-white group-hover:text-lavender-spark transition-colors" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-mid-ash tracking-wide px-2.5 py-1 rounded-full bg-midnight-plum border border-fog-line/10">
                        {feature.tag}
                      </span>
                      {feature.badge && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400">
                          {feature.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Body */}
                  <h3 className="text-lg font-semibold text-bone-white mb-2 tracking-tight group-hover:text-bone-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-ash-veil leading-relaxed font-normal">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Action Affordance */}
                <div className="pt-5 mt-4 border-t border-fog-line/10 flex items-center text-xs font-medium text-bone-white group-hover:text-lavender-spark transition-colors">
                  <span>Explore capability</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================
          ARCHITECTURE SECTION — On-Chain Verification Flow
          ========================================================= */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="neutral">Under the Hood</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-bone-white tracking-tight">
            How the credential registry operates
          </h2>
          <p className="text-sm sm:text-base text-ash-veil">
            A frictionless pipeline from wallet authentication to permanent on-chain certification.
          </p>
        </div>

        <Card variant="default" padding="xl" className="max-w-5xl mx-auto border-fog-line/15">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {architectureSteps.map((step, i) => (
              <div key={step.label} className="relative flex flex-col items-center text-center p-4 rounded-xl bg-midnight-plum/40 border border-fog-line/10">
                {/* Step Pill */}
                <span className="text-[10px] font-mono font-bold text-lavender-spark px-2 py-0.5 rounded-full bg-shadow-plum border border-lavender-spark/20 mb-4">
                  STEP {step.step}
                </span>

                {/* Icon Container */}
                <div className="w-14 h-14 rounded-2xl bg-shadow-plum border border-lavender-spark/30 flex items-center justify-center mb-4 shadow-glow-sm">
                  <step.icon className="w-6 h-6 text-lavender-spark" strokeWidth={1.5} />
                </div>

                <h4 className="text-base font-semibold text-bone-white mb-1.5 tracking-tight">{step.label}</h4>
                <p className="text-xs text-mid-ash leading-relaxed max-w-[180px]">{step.sublabel}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* =========================================================
          CTA BANNER & FOOTER
          ========================================================= */}
      <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-b from-shadow-plum to-midnight-plum border border-fog-line/15 p-10 sm:p-14 text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-bone-white tracking-tight">
            Ready to issue tamper-proof certificates?
          </h2>
          <p className="text-sm text-ash-veil leading-relaxed">
            Register your educational institution in under 2 minutes and start certifying achievements on Nervos CKB.
          </p>
          <div className="pt-2 flex justify-center gap-3.5 flex-wrap">
            <Link href="/clusters">
              <Button size="lg" className="px-6 py-3 text-sm font-semibold shadow-glow-green/30">
                Register Institution Now →
              </Button>
            </Link>
            <Link href="/verify">
              <Button variant="secondary" size="lg" className="px-6 py-3 text-sm font-medium">
                Verify an ID
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Doppler Footer */}
      <footer className="py-8">
        <div className="aurora-divider mb-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-mid-ash">
          <div className="flex items-center gap-2">
            <CredoraLogo size={18} />
            <span className="text-bone-white font-semibold">Credora</span>
          </div>
          <p>
            Powered by <span className="text-lavender-spark">Spore Protocol</span> on Nervos CKB
          </p>
        </div>
      </footer>
    </div>
  );
}

