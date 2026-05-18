'use client';
import { useEffect, useState } from 'react';
import { IdleScreen } from '@/components/kiosk/idle-screen';
import { ServiceSelector } from '@/components/kiosk/service-selector';
import { ServiceChoice } from '@/components/kiosk/service-choice';
import { SOPViewer } from '@/components/kiosk/sop-viewer';
import { TicketDisplay } from '@/components/kiosk/ticket-display';
import type { Service } from '@/lib/constants';
import { queueApi } from '@/lib/api/queue';
import { toastError } from '@/lib/toast';
import type { QueueItem } from '@/types/queue';

type Step = 'idle' | 'select' | 'choice' | 'sop' | 'ticket';

const TICKET_AUTO_RESET_MS = 18000;

export default function KioskPage() {
  const [step, setStep] = useState<Step>('idle');
  const [service, setService] = useState<Service | null>(null);
  const [ticket, setTicket] = useState<QueueItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep('idle');
    setService(null);
    setTicket(null);
  };

  const handleConfirm = async (svc: Service) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const created = await queueApi.create(svc.key);
      setTicket(created);
      setStep('ticket');
    } catch (err) {
      toastError(err, 'Gagal mengambil nomor antrian. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (step !== 'ticket') return;
    const t = setTimeout(reset, TICKET_AUTO_RESET_MS);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div
        className="kiosk screen"
        data-screen-label="01 Kiosk"
        onClick={step === 'idle' ? () => setStep('select') : undefined}
      >
        {step === 'idle' && <IdleScreen />}
        {step === 'select' && (
          <ServiceSelector
            onPick={(svc) => {
              setService(svc);
              setStep('choice');
            }}
            onCancel={reset}
          />
        )}
        {step === 'choice' && service && (
          <ServiceChoice
            svc={service}
            onPickSOP={() => setStep('sop')}
            onPickDirect={() => handleConfirm(service)}
            onBack={() => setStep('select')}
          />
        )}
        {step === 'sop' && service && (
          <SOPViewer
            svc={service}
            onConfirm={() => handleConfirm(service)}
            onBack={() => setStep('choice')}
          />
        )}
        {step === 'ticket' && ticket && service && (
          <TicketDisplay ticket={ticket} svc={service} onDone={reset} />
        )}
      </div>
    </main>
  );
}
