import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CertificateDetail } from '@/components/certificate/CertificateDetail';
import type { CertificateDNA } from '@/types';

describe('CertificateDetail Component View Toggle', () => {
  const mockCert: CertificateDNA = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: '0xabcdef1234567890',
    type: ['VerifiableCredential', 'CourseCertificate'],
    issuer: { id: 'ckt1cluster', name: 'CKB Academy' },
    issuanceDate: '2026-02-01T00:00:00Z',
    credentialSubject: {
      type: 'CourseCertificate',
      name: 'Grace Hopper',
      courseName: 'Compiler Construction on CKB-VM',
      completionDate: '2026-02-01',
      metadata: {
        layout: 'classic',
        theme: 'gold',
      },
    },
  };

  it('defaults to Visual Certificate view and displays student name', () => {
    render(
      <CertificateDetail
        certificate={mockCert}
        certificateId="cert_gh_123"
      />
    );

    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Print \/ Save PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /On-Chain Proof/i })).toBeInTheDocument();
  });

  it('switches to On-Chain Proof view when clicking technical tab', () => {
    render(
      <CertificateDetail
        certificate={mockCert}
        certificateId="cert_gh_123"
      />
    );

    const techTab = screen.getByRole('button', { name: /On-Chain Proof/i });
    fireEvent.click(techTab);

    expect(screen.getByText(/On-Chain Cryptographic Proof/i)).toBeInTheDocument();
    expect(screen.getByText(/Certificate ID/i)).toBeInTheDocument();
  });

  it('triggers window.print when clicking Print / Save PDF button', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <CertificateDetail
        certificate={mockCert}
        certificateId="cert_gh_123"
      />
    );

    const printButton = screen.getByRole('button', { name: /Print \/ Save PDF/i });
    fireEvent.click(printButton);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('renders certificate with issuer visual metadata in visual view', () => {
    render(
      <CertificateDetail
        certificate={mockCert}
        certificateId="cert_gh_123"
      />
    );

    // Initial classic layout and gold theme from mockCert metadata are rendered
    expect(screen.getByText(/CERTIFICATE OF COMPLETION/i)).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('Compiler Construction on CKB-VM')).toBeInTheDocument();
  });

  it('opens melt modal when Melt & Reclaim CKB is clicked', () => {
    const mockMelt = vi.fn();
    render(
      <CertificateDetail
        certificate={mockCert}
        certificateId="cert_gh_123"
        onMelt={mockMelt}
      />
    );

    const meltBtn = screen.getByRole('button', { name: /Melt & Reclaim CKB/i });
    fireEvent.click(meltBtn);

    expect(screen.getByText(/permanently destroy/i)).toBeInTheDocument();
  });

  it('allows melting when certificate is expired', () => {
    const expiredCert: CertificateDNA = {
      ...mockCert,
      expirationDate: '2020-01-01T00:00:00Z', // Definitely in the past
    };
    const mockMelt = vi.fn();

    render(
      <CertificateDetail
        certificate={expiredCert}
        certificateId="cert_expired_123"
        onMelt={mockMelt}
      />
    );

    // In Visual mode, Melt button should still be rendered
    const meltBtn = screen.getByRole('button', { name: /Melt & Reclaim CKB/i });
    expect(meltBtn).toBeInTheDocument();
    fireEvent.click(meltBtn);
    expect(screen.getByText(/permanently destroy/i)).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    // In Technical mode, Melt button should also be rendered
    const techTab = screen.getByRole('button', { name: /On-Chain Proof/i });
    fireEvent.click(techTab);
    const techMeltBtns = screen.getAllByRole('button', { name: /Melt & Reclaim CKB/i });
    expect(techMeltBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('displays success popup on melt success and calls onMeltSuccess when closed', async () => {
    const mockMelt = vi.fn().mockResolvedValue(undefined);
    const mockMeltSuccess = vi.fn();

    render(
      <CertificateDetail
        certificate={mockCert}
        certificateId="cert_gh_123"
        onMelt={mockMelt}
        onMeltSuccess={mockMeltSuccess}
      />
    );

    // Open modal
    const meltBtn = screen.getByRole('button', { name: /Melt & Reclaim CKB/i });
    fireEvent.click(meltBtn);

    // Click confirm melt in modal
    const confirmBtn = screen.getByRole('button', { name: /Melt & Reclaim$/i });
    fireEvent.click(confirmBtn);

    expect(mockMelt).toHaveBeenCalled();

    // Success popup should be displayed
    await waitFor(() => {
      expect(screen.getByText('Certificate Melted Successfully')).toBeInTheDocument();
    });

    // Close button should be present
    const closeBtn = screen.getByRole('button', { name: /^Close$/i });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(mockMeltSuccess).toHaveBeenCalled();
  });

  it('displays error inside modal when melting fails without navigating away', async () => {
    const mockMelt = vi.fn().mockRejectedValue(new Error('Transaction rejected by user'));
    const mockMeltSuccess = vi.fn();

    render(
      <CertificateDetail
        certificate={mockCert}
        certificateId="cert_gh_123"
        onMelt={mockMelt}
        onMeltSuccess={mockMeltSuccess}
      />
    );

    // Open modal
    const meltBtn = screen.getByRole('button', { name: /Melt & Reclaim CKB/i });
    fireEvent.click(meltBtn);

    // Click confirm melt
    const confirmBtn = screen.getByRole('button', { name: /Melt & Reclaim$/i });
    fireEvent.click(confirmBtn);

    // Error should be displayed inside modal
    await waitFor(() => {
      expect(screen.getByText('Transaction rejected by user')).toBeInTheDocument();
    });
    expect(mockMeltSuccess).not.toHaveBeenCalled();

    // Modal should remain open with Close button
    expect(screen.getByRole('button', { name: /^Close$/i })).toBeInTheDocument();
  });

  it('displays Address with explorer link and copy button when recipient has a wallet address', () => {
    const walletAddress = 'ckt1qrejnmlar3r452tcg57gvq8patctcgy8acync0hxfnyka35ywafvkqgj2xytre60kv8kr43syxjj45769h77qzd5qq790twu';
    const addressCert: CertificateDNA = {
      ...mockCert,
      credentialSubject: {
        ...mockCert.credentialSubject,
        id: walletAddress,
      },
    };

    render(
      <CertificateDetail
        certificate={addressCert}
        certificateId="cert_addr_123"
      />
    );

    // Switch to Technical / On-Chain Proof mode
    const techTab = screen.getByRole('button', { name: /On-Chain Proof/i });
    fireEvent.click(techTab);

    // Should display Address: label
    expect(screen.getByText('Address:')).toBeInTheDocument();
    expect(screen.getByText(walletAddress)).toBeInTheDocument();

    // Should NOT display DID: label
    expect(screen.queryByText('DID:')).not.toBeInTheDocument();

    // Explorer link should be present and point to the address URL
    const explorerLink = screen.getByTitle('View on CKB Explorer');
    expect(explorerLink).toBeInTheDocument();
    expect(explorerLink).toHaveAttribute('href', expect.stringContaining(`/address/${walletAddress}`));
    expect(explorerLink).toHaveAttribute('target', '_blank');

    // Copy Address button should be present
    const copyButton = screen.getByTitle('Copy Address');
    expect(copyButton).toBeInTheDocument();
  });

  it('displays DID with copy button only and no explorer link when recipient has a DID', () => {
    const did = 'did:ckb:3ufnokjbydg6kj6b5fngnee2y2miuabc';
    const didCert: CertificateDNA = {
      ...mockCert,
      credentialSubject: {
        ...mockCert.credentialSubject,
        id: did,
      },
    };

    render(
      <CertificateDetail
        certificate={didCert}
        certificateId="cert_did_123"
      />
    );

    // Switch to Technical / On-Chain Proof mode
    const techTab = screen.getByRole('button', { name: /On-Chain Proof/i });
    fireEvent.click(techTab);

    // Should display DID: label and value
    expect(screen.getByText('DID:')).toBeInTheDocument();
    expect(screen.getByText(did)).toBeInTheDocument();

    // Should have Copy DID button
    const copyDidButton = screen.getByTitle('Copy DID');
    expect(copyDidButton).toBeInTheDocument();

    // Should NOT have Address: row or explorer link for DID
    expect(screen.queryByText('Address:')).not.toBeInTheDocument();
    expect(screen.queryByTitle('View on CKB Explorer')).not.toBeInTheDocument();
  });

  it('displays both DID and resolved Address when recipient has a DID with walletAddress', () => {
    const did = 'did:ckb:3ufnokjbydg6kj6b5fngnee2y2miuabc';
    const walletAddress = 'ckt1qrejnmlar3r452tcg57gvq8patctcgy8acync0hxfnyka35ywafvkqgj2xytre60kv8kr43syxjj45769h77qzd5qq790twu';
    const didCertWithWallet: CertificateDNA = {
      ...mockCert,
      credentialSubject: {
        ...mockCert.credentialSubject,
        id: did,
        walletAddress,
      },
    };

    render(
      <CertificateDetail
        certificate={didCertWithWallet}
        certificateId="cert_did_wallet_123"
      />
    );

    // Switch to Technical / On-Chain Proof mode
    const techTab = screen.getByRole('button', { name: /On-Chain Proof/i });
    fireEvent.click(techTab);

    // Both DID and Address should be displayed
    expect(screen.getByText('DID:')).toBeInTheDocument();
    expect(screen.getByText(did)).toBeInTheDocument();
    expect(screen.getByTitle('Copy DID')).toBeInTheDocument();

    expect(screen.getByText('Address:')).toBeInTheDocument();
    expect(screen.getByText(walletAddress)).toBeInTheDocument();
    expect(screen.getByTitle('Copy Address')).toBeInTheDocument();
    expect(screen.getByTitle('View on CKB Explorer')).toHaveAttribute(
      'href',
      expect.stringContaining(`/address/${walletAddress}`)
    );
  });
});
