import { Spinner } from '@/components/ui';

export default function ClustersLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Spinner size="lg" label="Loading accredited institutions..." />
    </div>
  );
}
