import { IntakeForm } from '@/components/mobile/intake-form';

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ svc?: string; nm?: string }>;
};

export default async function IntakePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { svc = '', nm = '' } = await searchParams;
  return (
    <main className="live-shell">
      <IntakeForm token={token} serviceKey={svc} serviceName={nm} />
    </main>
  );
}
