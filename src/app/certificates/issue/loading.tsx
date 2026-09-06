import { Spinner } from '@/components/ui';

export default function IssueLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Spinner size="lg" label="Preparing issuance workspace..." />
    </div>
  );
}
