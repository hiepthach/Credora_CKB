import { Spinner } from '@/components/ui';

export default function CertificatesLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Spinner size="lg" label="Loading verifiable credentials..." />
    </div>
  );
}
