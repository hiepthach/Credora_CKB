import { Spinner } from '@/components/ui';

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Spinner size="lg" label="Synchronizing with CKB..." />
    </div>
  );
}
