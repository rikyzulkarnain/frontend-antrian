import { MobileScreen } from '@/components/mobile/mobile-screen';

type PageProps = { params: Promise<{ ticketId: string }> };

export default async function MobilePage({ params }: PageProps) {
  const { ticketId } = await params;
  return (
    <main className="live-shell">
      <MobileScreen ticketId={ticketId} />
    </main>
  );
}
