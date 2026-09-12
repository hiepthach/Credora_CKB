import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchUpload } from '@/components/batch/BatchUpload';

function blobToText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') {
    return blob.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe('BatchUpload Component', () => {
  let createdBlobs: { blob: Blob; filename?: string; mimeType?: string }[] = [];
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let clickSpy: any;

  beforeEach(() => {
    createdBlobs = [];
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    URL.createObjectURL = vi.fn((blob: Blob) => {
      createdBlobs.push({ blob });
      return 'mock-blob-url';
    });
    URL.revokeObjectURL = vi.fn();
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    clickSpy?.mockRestore();
    vi.restoreAllMocks();
  });

  it('renders upload area and download template buttons', () => {
    render(<BatchUpload onFileSelect={vi.fn()} />);

    expect(screen.getByText(/Batch Certificate Issuance/i)).toBeInTheDocument();
    expect(screen.getByText(/Drop file here or click to browse/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CSV Template/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /JSON Template/i })).toBeInTheDocument();
  });

  it('downloads CSV template with optional style columns (layout, theme, customColor, customTitle)', async () => {
    render(<BatchUpload onFileSelect={vi.fn()} />);

    const csvButton = screen.getByRole('button', { name: /CSV Template/i });
    fireEvent.click(csvButton);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(createdBlobs).toHaveLength(1);

    const blob = createdBlobs[0].blob;
    expect(blob.type).toBe('text/csv');

    const content = await blobToText(blob);
    expect(content).toContain('layout,theme,customColor,customTitle');
    expect(content).toContain('classic,gold,,CERTIFICATE OF EXCELLENCE');
    expect(content).toContain('modern,custom,#F26F21,DIPLOMA');
  });

  it('downloads JSON template with optional style fields (layout, theme, customColor, customTitle)', async () => {
    render(<BatchUpload onFileSelect={vi.fn()} />);

    const jsonButton = screen.getByRole('button', { name: /JSON Template/i });
    fireEvent.click(jsonButton);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(createdBlobs).toHaveLength(1);

    const blob = createdBlobs[0].blob;
    expect(blob.type).toBe('application/json');

    const content = await blobToText(blob);
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);

    expect(parsed[0]).toMatchObject({
      recipientAddress: 'ckt1qrejnmlar3r452tcg57gvq8patctcgy8acync0hxfnyka35ywafvkqgj2xytre60kv8kr43syxjj45769h77qzd5qq790abc',
      recipientName: 'John Doe',
      courseName: 'CKB Basics',
      layout: 'classic',
      theme: 'gold',
      customTitle: 'CERTIFICATE OF EXCELLENCE',
    });

    expect(parsed[1]).toMatchObject({
      recipientAddress: 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqx5zp6gss3dk2twvx36e9pz449rthejplgx6gxyz',
      recipientName: 'Jane Smith',
      courseName: 'CKB Basics',
      layout: 'modern',
      theme: 'custom',
      customColor: '#F26F21',
      customTitle: 'DIPLOMA',
    });
  });

  it('calls onFileSelect when a valid CSV file is uploaded', () => {
    const handleFileSelect = vi.fn();
    render(<BatchUpload onFileSelect={handleFileSelect} />);

    const input = document.getElementById('batch-file-input') as HTMLInputElement;
    const file = new File(['test'], 'certs.csv', { type: 'text/csv' });

    fireEvent.change(input, { target: { files: [file] } });
    expect(handleFileSelect).toHaveBeenCalledWith(file);
  });

  it('displays error when an invalid file extension is uploaded', () => {
    const handleFileSelect = vi.fn();
    render(<BatchUpload onFileSelect={handleFileSelect} />);

    const input = document.getElementById('batch-file-input') as HTMLInputElement;
    const file = new File(['test'], 'certs.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });
    expect(handleFileSelect).not.toHaveBeenCalled();
    expect(screen.getByText(/Invalid file type. Accepted: .csv, .json/i)).toBeInTheDocument();
  });
});
