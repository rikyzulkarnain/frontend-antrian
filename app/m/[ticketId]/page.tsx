import { MobileScreen } from '@/components/mobile/mobile-screen';

type PageProps = { params: Promise<{ ticketId: string }> };

export default async function MobilePage({ params }: PageProps) {
  const { ticketId } = await params;
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <MobileScreen ticketId={ticketId} />
    </main>
  );
}
