'use client';

import { useState, useCallback } from 'react';
import { Card, Button } from '@/components/ui';
import { Upload, FileText, Download, AlertCircle } from 'lucide-react';

interface BatchUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string[];
  maxSize?: number; // in bytes
}

export function BatchUpload({
  onFileSelect,
  accept = ['.csv', '.json'],
  maxSize = 10 * 1024 * 1024, // 10MB default
}: BatchUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!accept.includes(extension)) {
      return `Invalid file type. Accepted: ${accept.join(', ')}`;
    }

    if (file.size > maxSize) {
      return `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    return null;
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onFileSelect(file);
  }, [onFileSelect, accept, maxSize]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const downloadTemplate = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const csv = `recipientAddress,recipientName,courseName,completionDate,expirationDate,grade,score,skills,layout,theme,customColor,customTitle
ckt1qrejnmlar3r452tcg57gvq8patctcgy8acync0hxfnyka35ywafvkqgj2xytre60kv8kr43syxjj45769h77qzd5qq790abc,John Doe,CKB Basics,2026-01-15,2027-01-15,A,95,Rust;CKB-VM,classic,gold,,CERTIFICATE OF EXCELLENCE
ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqx5zp6gss3dk2twvx36e9pz449rthejplgx6gxyz,Jane Smith,CKB Basics,2026-01-16,,B+,88,CKB-VM,modern,custom,#F26F21,DIPLOMA,
did:ckb:3ufnokjbydg6kj6b5fngnee2y2miuabc,Hannie Kim,CKB Basics,2026-01-16,,B+,88,CKB-VM,modern,custom,#F26F21,DIPLOMA`;
      downloadFile(csv, 'certificate_template.csv', 'text/csv');
    } else {
      const json = JSON.stringify([
        {
          recipientAddress: 'ckt1qrejnmlar3r452tcg57gvq8patctcgy8acync0hxfnyka35ywafvkqgj2xytre60kv8kr43syxjj45769h77qzd5qq790abc',
          recipientName: 'John Doe',
          courseName: 'CKB Basics',
          completionDate: '2026-01-15',
          expirationDate: '2027-01-15',
          grade: 'A',
          score: 95,
          skills: ['Rust', 'CKB-VM'],
          layout: 'classic',
          theme: 'gold',
          customTitle: 'CERTIFICATE OF EXCELLENCE',
        },
        {
          recipientAddress: 'ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqx5zp6gss3dk2twvx36e9pz449rthejplgx6gxyz',
          recipientName: 'Jane Smith',
          courseName: 'CKB Basics',
          completionDate: '2026-01-16',
          grade: 'B+',
          score: 88,
          skills: ['CKB-VM'],
          layout: 'modern',
          theme: 'custom',
          customColor: '#F26F21',
          customTitle: 'DIPLOMA',
        },
      ], null, 2);
      downloadFile(json, 'certificate_template.json', 'application/json');
    }
  };

  return (
    <Card variant="default" padding="lg">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-bone-white mb-2">
          Batch Certificate Issuance
        </h2>
        <p className="text-sm text-ash-veil">
          Upload a CSV or JSON file to issue multiple certificates at once
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging
            ? 'border-lavender-spark bg-lavender-spark/10'
            : 'border-fog-line/20 hover:border-lavender-spark/50 bg-midnight-plum/30 hover:bg-midnight-plum/60'
          }
        `}
      >
        <input
          type="file"
          accept={accept.join(',')}
          onChange={handleInputChange}
          className="hidden"
          id="batch-file-input"
        />
        <label
          htmlFor="batch-file-input"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 bg-deep-indigo rounded-xl border border-fog-line/15 flex items-center justify-center text-lavender-spark">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-bone-white font-medium">
              Drop file here or click to browse
            </p>
            <p className="text-sm text-mid-ash mt-1">
              Supports CSV and JSON files up to {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Templates */}
      <div className="mt-6 pt-6 border-t border-fog-line/10">
        <p className="text-sm text-ash-veil mb-3">Download templates:</p>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={() => downloadTemplate('csv')}>
            <FileText className="w-4 h-4" />
            CSV Template
          </Button>
          <Button variant="secondary" size="sm" onClick={() => downloadTemplate('json')}>
            <Download className="w-4 h-4" />
            JSON Template
          </Button>
        </div>
      </div>
    </Card>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
