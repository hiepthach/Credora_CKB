import { Spinner } from '@/components/ui';

export default function VerifyLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Spinner size="lg" label="Initializing cryptographic verifier..." />
    </div>
  );
}
