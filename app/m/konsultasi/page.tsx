import { ConsultationForm } from '@/components/mobile/consultation-form';

type PageProps = {
  searchParams: Promise<{ ref?: string; tp?: string }>;
};

export default async function KonsultasiPage({ searchParams }: PageProps) {
  const { ref = '', tp = '' } = await searchParams;
  return (
    <main className="live-shell">
      <ConsultationForm refId={ref} topic={tp} />
    </main>
  );
}
