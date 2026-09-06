import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CertificateForm } from '@/components/certificate/CertificateForm';

// Mock useWallet hook
vi.mock('@/hooks/useWallet', () => ({
  useWallet: vi.fn(() => ({
    client: null, // No client in tests - DID resolution won't trigger
    address: null,
    signer: null,
    isConnected: false,
    isLoadingAddress: false,
    open: vi.fn(),
  })),
}));

describe('CertificateForm Style Selection & Color Picker', () => {
  it('renders certificate layout, color picker, and custom title options and includes them on submit', () => {
    const handleSubmit = vi.fn();
    const handleChange = vi.fn();

    render(
      <CertificateForm
        clusterId="test_cluster"
        clusterName="University of CKB"
        defaultRecipientAddress="ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv"
        onSubmit={handleSubmit}
        onChange={handleChange}
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/Student name/i), {
      target: { value: 'Satoshi Nakamoto' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Course or program/i), {
      target: { value: 'Proof of Work Economics' },
    });

    // Select Modern layout
    const modernButton = screen.getByRole('button', { name: /^Modern$/i });
    fireEvent.click(modernButton);

    // Select Custom theme and enter custom color
    const customThemeButton = screen.getByRole('button', { name: /Custom/i });
    fireEvent.click(customThemeButton);

    const customColorInput = screen.getByPlaceholderText(/#1E40AF/i);
    fireEvent.change(customColorInput, { target: { value: '#F26F21' } });

    // Enter custom title
    const customTitleInput = screen.getByPlaceholderText(/e\.g\. DIPLOMA, CERTIFICATE/i);
    fireEvent.change(customTitleInput, { target: { value: 'EXCELLENCE AWARD' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Mint Certificate|Mint Spore/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientName: 'Satoshi Nakamoto',
        courseName: 'Proof of Work Economics',
        layout: 'modern',
        theme: 'custom',
        customColor: '#F26F21',
        customTitle: 'EXCELLENCE AWARD',
      })
    );
  });

  it('notifies onChange whenever fields are updated', () => {
    const handleChange = vi.fn();

    render(
      <CertificateForm
        clusterId="test_cluster"
        clusterName="University of CKB"
        defaultRecipientAddress="ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv"
        onSubmit={vi.fn()}
        onChange={handleChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Student name|Jane Doe/i), {
      target: { value: 'Vitalik' },
    });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientName: 'Vitalik',
      })
    );
  });

  it('supports selecting preset themes and layouts', () => {
    const handleSubmit = vi.fn();

    render(
      <CertificateForm
        clusterId="test_cluster"
        clusterName="University of CKB"
        defaultRecipientAddress="ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv"
        onSubmit={handleSubmit}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Student name|Jane Doe/i), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Course or program/i), {
      target: { value: 'CKB Development' },
    });

    // Click Badge layout
    fireEvent.click(screen.getByRole('button', { name: /^Badge$/i }));

    // Click Gold theme
    fireEvent.click(screen.getByRole('button', { name: /Gold/i }));

    const submitBtn = screen.getByRole('button', { name: /Mint Certificate|Mint Spore/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientName: 'Alice',
        courseName: 'CKB Development',
        layout: 'badge',
        theme: 'gold',
      })
    );
  });

  it('supports selecting a 1-click preset template', () => {
    const handleSubmit = vi.fn();

    render(
      <CertificateForm
        clusterId="test_cluster"
        clusterName="University of CKB"
        defaultRecipientAddress="ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv"
        onSubmit={handleSubmit}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Student name|Jane Doe/i), {
      target: { value: 'Bob' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Course or program/i), {
      target: { value: 'Full-Stack CKB' },
    });

    // Click 1-click preset: Academic Classic (classic / gold)
    fireEvent.click(screen.getByRole('button', { name: /Preset: Academic Classic/i }));

    const submitBtn = screen.getByRole('button', { name: /Mint Certificate|Mint Spore/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientName: 'Bob',
        courseName: 'Full-Stack CKB',
        layout: 'classic',
        theme: 'gold',
      })
    );
  });
});
