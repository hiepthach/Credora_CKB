import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchPreview } from '@/components/batch/BatchPreview';
import type { BatchEntry } from '@/types';

const mockEntries: BatchEntry[] = [
  {
    row: 1,
    recipientAddress: 'ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv',
    recipientName: 'Alice Developer',
    courseName: 'CKB Blockchain Masterclass',
    completionDate: '2026-03-01',
    valid: true,
  },
  {
    row: 2,
    recipientAddress: 'ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqw',
    recipientName: 'Bob Builder',
    courseName: 'Spore DOB Protocol Deep Dive',
    completionDate: '2026-03-02',
    layout: 'modern',
    theme: 'purple',
    customTitle: 'DOB SPECIALIST',
    valid: true,
  },
  {
    row: 3,
    recipientAddress: 'invalid_address',
    recipientName: 'Charlie Error',
    courseName: 'Intro to Web3',
    completionDate: '2026-03-03',
    valid: false,
    errors: ['Invalid CKB address format'],
  },
];

describe('BatchPreview Component', () => {
  it('renders stats, table with Style column, and default style selector', () => {
    render(
      <BatchPreview
        entries={mockEntries}
        estimatedCost="302 CKB"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Stats
    expect(screen.getAllByText('Valid').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Invalid').length).toBeGreaterThanOrEqual(1);

    // Table headers including Style
    expect(screen.getByText('Style')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();

    // Row styles in table
    expect(screen.getAllByText('(Global)').length).toBe(2);
    expect(screen.getByText('modern')).toBeInTheDocument();

    // Style & Appearance section
    expect(screen.getByText(/Batch Certificate Style & Appearance/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Individual entries with custom layout or customTitle in CSV\/JSON will override this default style/i
      )
    ).toBeInTheDocument();

    // Layout options
    expect(screen.getByRole('button', { name: /Classic/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Modern/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compact/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Detailed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Badge/i })).toBeInTheDocument();

    // Theme options
    expect(screen.getByRole('button', { name: /Blue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Purple/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Green/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Red/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Custom/i })).toBeInTheDocument();
  });

  it('renders live certificate preview for the first valid entry', () => {
    render(
      <BatchPreview
        entries={mockEntries}
        estimatedCost="302 CKB"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/Live Certificate Preview/i)).toBeInTheDocument();
    // First valid entry is Alice Developer which appears in both table and live preview
    const aliceOccurrences = screen.getAllByText('Alice Developer');
    expect(aliceOccurrences.length).toBeGreaterThanOrEqual(2);

    const courseOccurrences = screen.getAllByText('CKB Blockchain Masterclass');
    expect(courseOccurrences.length).toBeGreaterThanOrEqual(2);
  });

  it('passes defaultStyle to onConfirm when clicking confirm button', () => {
    const handleConfirm = vi.fn();
    render(
      <BatchPreview
        entries={mockEntries}
        estimatedCost="302 CKB"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Issue 2 Certificates/i });
    fireEvent.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: 'classic',
        theme: 'blue',
      })
    );
  });

  it('updates defaultStyle when selecting layout, theme, and custom title, and passes them on confirm', () => {
    const handleConfirm = vi.fn();
    render(
      <BatchPreview
        entries={mockEntries}
        estimatedCost="302 CKB"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    // Select 'detailed' layout
    const detailedLayoutBtn = screen.getByRole('button', { name: /Detailed/i });
    fireEvent.click(detailedLayoutBtn);

    // Select 'gold' theme
    const goldThemeBtn = screen.getByRole('button', { name: /Gold/i });
    fireEvent.click(goldThemeBtn);

    // Enter custom title
    const customTitleInput = screen.getByPlaceholderText(/e\.g\. DIPLOMA, CERTIFICATE OF EXCELLENCE/i);
    fireEvent.change(customTitleInput, { target: { value: 'HONORARY FELLOW' } });

    // Confirm
    const confirmButton = screen.getByRole('button', { name: /Issue 2 Certificates/i });
    fireEvent.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: 'detailed',
        theme: 'gold',
        customTitle: 'HONORARY FELLOW',
      })
    );
  });

  it('shows custom color picker when theme is custom and updates customColor', () => {
    const handleConfirm = vi.fn();
    render(
      <BatchPreview
        entries={mockEntries}
        estimatedCost="302 CKB"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    // Select 'custom' theme
    const customThemeBtn = screen.getByRole('button', { name: /Custom/i });
    fireEvent.click(customThemeBtn);

    // Custom hex input should now appear
    const hexInput = screen.getByPlaceholderText('#1E40AF');
    expect(hexInput).toBeInTheDocument();

    fireEvent.change(hexInput, { target: { value: '#FF5733' } });

    // Confirm
    const confirmButton = screen.getByRole('button', { name: /Issue 2 Certificates/i });
    fireEvent.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: 'custom',
        customColor: '#FF5733',
      })
    );
  });

  it('calls onCancel when clicking cancel button', () => {
    const handleCancel = vi.fn();
    render(
      <BatchPreview
        entries={mockEntries}
        estimatedCost="302 CKB"
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });

  it('disables confirm button when all entries are invalid', () => {
    const invalidEntries: BatchEntry[] = [
      {
        row: 1,
        recipientAddress: 'invalid_addr',
        courseName: 'Course 1',
        completionDate: '2026-03-01',
        valid: false,
        errors: ['Invalid address'],
      },
    ];

    render(
      <BatchPreview
        entries={invalidEntries}
        estimatedCost="0 CKB"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Issue 0 Certificates/i });
    expect(confirmButton).toBeDisabled();
  });

  it('displays invalid entries summary banner with row numbers and direct error reasons in table', () => {
    render(
      <BatchPreview
        entries={mockEntries}
        estimatedCost="302 CKB"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Banner should be visible because mockEntries has row 3 with errors
    expect(screen.getByText(/1 Invalid Row Found in File/i)).toBeInTheDocument();
    expect(screen.getByText(/Row #3/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Invalid CKB address format/i).length).toBeGreaterThanOrEqual(1);
  });
});

describe('BatchPreview Vellum Claim Cells Option', () => {
  const didEntry1: BatchEntry = {
    row: 1,
    recipientAddress: 'did:ckb:abcdefghijklmnopqrstuvwxyz234567',
    recipientName: 'Alice DID',
    courseName: 'Course Alpha',
    completionDate: '2026-03-01',
    valid: true,
  };

  const didEntry2: BatchEntry = {
    row: 2,
    recipientAddress: 'did:ckb:0123456789abcdef0123456789abcdef',
    recipientName: 'Bob DID',
    courseName: 'Course Beta',
    completionDate: '2026-03-02',
    valid: true,
  };

  const ckbEntry: BatchEntry = {
    row: 3,
    recipientAddress: 'ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv',
    recipientName: 'Charlie Standard',
    courseName: 'Course Gamma',
    completionDate: '2026-03-03',
    valid: true,
  };

  it('does not render Vellum Claim Cells toggle when entries contain no DIDs', () => {
    render(
      <BatchPreview
        entries={mockEntries}
        estimatedCost="302 CKB"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByLabelText(/Include Vellum Claim Cells/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Include Vellum Claim Cells/i)).not.toBeInTheDocument();
  });

  it('renders Vellum Claim Cells toggle showing count and "+350 CKB" for a single valid DID entry', () => {
    render(
      <BatchPreview
        entries={[didEntry1, ckbEntry]}
        estimatedCost="302 CKB"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const checkbox = screen.getByLabelText(/Include Vellum Claim Cells \(1 certificates\)/i) as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);
    expect(screen.getByText(/\+350 CKB/i)).toBeInTheDocument();
  });

  it('renders Vellum Claim Cells toggle showing "+700 CKB" for two valid DID entries', () => {
    render(
      <BatchPreview
        entries={[didEntry1, didEntry2, ckbEntry]}
        estimatedCost="450 CKB"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const checkbox = screen.getByLabelText(/Include Vellum Claim Cells \(2 certificates\)/i) as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);
    expect(screen.getByText(/\+700 CKB/i)).toBeInTheDocument();
  });

  it('does not count invalid DID entries towards Claim Cell certificates or capacity', () => {
    const invalidDidEntry: BatchEntry = {
      row: 4,
      recipientAddress: 'did:ckb:invalid_identifier',
      recipientName: 'Invalid DID User',
      courseName: 'Course Delta',
      completionDate: '2026-03-04',
      valid: false,
      errors: ['Invalid DID format'],
    };

    render(
      <BatchPreview
        entries={[didEntry1, invalidDidEntry]}
        estimatedCost="150 CKB"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Only 1 valid DID certificate eligible
    expect(screen.getByLabelText(/Include Vellum Claim Cells \(1 certificates\)/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Include Vellum Claim Cells \(2 certificates\)/i)).not.toBeInTheDocument();
    expect(screen.getByText(/\+350 CKB/i)).toBeInTheDocument();
  });

  it('recognizes DID entries via entry.isDid flag or did:ckb: address prefix', () => {
    const resolvedDidEntry: BatchEntry = {
      row: 5,
      recipientAddress: 'ckt1qzda0cr08m85hc8j9ngns49pn30ep606x4qp8nd500w494ps2qscq2fnsqv',
      isDid: true,
      recipientName: 'Resolved DID',
      courseName: 'Course Epsilon',
      completionDate: '2026-03-01',
      valid: true,
    };

    render(
      <BatchPreview
        entries={[resolvedDidEntry, didEntry1]}
        estimatedCost="300 CKB"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Both should be recognized as DID entries
    expect(screen.getByLabelText(/Include Vellum Claim Cells \(2 certificates\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\+700 CKB/i)).toBeInTheDocument();
  });

  it('does not render toggle if all DID entries are invalid', () => {
    const invalidDidEntry: BatchEntry = {
      row: 1,
      recipientAddress: 'did:ckb:bad_format',
      courseName: 'Course Zeta',
      completionDate: '2026-03-01',
      valid: false,
      errors: ['Invalid DID checksum'],
    };

    render(
      <BatchPreview
        entries={[invalidDidEntry, ckbEntry]}
        estimatedCost="150 CKB"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByLabelText(/Include Vellum Claim Cells/i)).not.toBeInTheDocument();
  });

  it('updates total locked capacity and cost display when toggle is checked and unchecked', () => {
    render(
      <BatchPreview
        entries={[didEntry1, ckbEntry]}
        estimatedCost="302 CKB"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const checkbox = screen.getByLabelText(/Include Vellum Claim Cells \(1 certificates\)/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    // Initial cost display
    expect(screen.getByText('302 CKB')).toBeInTheDocument();

    // Toggle ON
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    // Cost display increases by 350 CKB -> 652 CKB
    expect(screen.getByText('652 CKB')).toBeInTheDocument();
    expect(screen.getByText(/^Vellum Claim Cells \(1 certificates\)$/i)).toBeInTheDocument();

    // Toggle OFF
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);

    // Cost display reverts to 302 CKB
    expect(screen.getByText('302 CKB')).toBeInTheDocument();
    expect(screen.queryByText(/^Vellum Claim Cells \(1 certificates\)$/i)).not.toBeInTheDocument();
    expect(screen.queryByText('652 CKB')).not.toBeInTheDocument();
  });

  it('updates exactTotalCapacity when exactTotalCapacity prop is provided and toggle is checked', () => {
    render(
      <BatchPreview
        entries={[didEntry1, didEntry2]}
        estimatedCost="1,000 CKB"
        exactTotalCapacity={1000}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const checkbox = screen.getByLabelText(/Include Vellum Claim Cells \(2 certificates\)/i) as HTMLInputElement;

    // Initial cost and average
    expect(screen.getByText('1,000 CKB')).toBeInTheDocument();
    expect(screen.getByText(/avg\. ~500 CKB \/ cert/i)).toBeInTheDocument();

    // Toggle ON (+700 CKB)
    fireEvent.click(checkbox);
    expect(screen.getByText('1,700 CKB')).toBeInTheDocument();
    expect(screen.getByText(/avg\. ~850 CKB \/ cert/i)).toBeInTheDocument();
  });

  it('passes includeVellumClaims in onConfirm when confirmed with toggle ON', () => {
    const handleConfirm = vi.fn();

    render(
      <BatchPreview
        entries={[didEntry1, ckbEntry]}
        estimatedCost="302 CKB"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    const checkbox = screen.getByLabelText(/Include Vellum Claim Cells \(1 certificates\)/i);
    fireEvent.click(checkbox);

    const confirmButton = screen.getByRole('button', { name: /Issue 2 Certificates/i });
    fireEvent.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: 'classic',
        theme: 'blue',
      }),
      { includeVellumClaims: true }
    );
  });

  it('passes includeVellumClaims: false in onConfirm when confirmed with toggle OFF', () => {
    const handleConfirm = vi.fn();

    render(
      <BatchPreview
        entries={[didEntry1, ckbEntry]}
        estimatedCost="302 CKB"
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Issue 2 Certificates/i });
    fireEvent.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: 'classic',
        theme: 'blue',
      }),
      { includeVellumClaims: false }
    );
  });

  it('supports controlled includeVellumClaims and onIncludeVellumClaimsChange props', () => {
    const handleClaimsChange = vi.fn();

    const { rerender } = render(
      <BatchPreview
        entries={[didEntry1, ckbEntry]}
        estimatedCost="302 CKB"
        includeVellumClaims={false}
        onIncludeVellumClaimsChange={handleClaimsChange}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const checkbox = screen.getByLabelText(/Include Vellum Claim Cells \(1 certificates\)/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(handleClaimsChange).toHaveBeenCalledWith(true);

    // Re-render as controlled true
    rerender(
      <BatchPreview
        entries={[didEntry1, ckbEntry]}
        estimatedCost="302 CKB"
        includeVellumClaims={true}
        onIncludeVellumClaimsChange={handleClaimsChange}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(checkbox.checked).toBe(true);
    expect(screen.getByText('652 CKB')).toBeInTheDocument();
  });
});
