'use client';
import { useEffect, useState } from 'react';
import { IdleScreen } from '@/components/kiosk/idle-screen';
import { ServiceSelector } from '@/components/kiosk/service-selector';
import { SOPViewer } from '@/components/kiosk/sop-viewer';
import { GuestWait } from '@/components/kiosk/guest-wait';
import { TicketDisplay } from '@/components/kiosk/ticket-display';
import { SERVICES, type Service } from '@/lib/constants';
import { useAutoFullscreen } from '@/hooks/useAutoFullscreen';
import { serviceApi } from '@/lib/api/service';
import { toastError } from '@/lib/toast';
import type { QueueItem } from '@/types/queue';
import type { Service as ApiService } from '@/types/service';

// Every service follows the same flow: read the SOP, then register name +
// purpose via the QR form on the visitor's phone before a number is issued.
type Step = 'idle' | 'select' | 'sop' | 'guest' | 'ticket';

const TICKET_AUTO_RESET_MS = 18000;
const SERVICES_REFRESH_MS = 5 * 60 * 1000; // 5 menit

function fromApi(s: ApiService): Service {
  return {
    key: s.key,
    code: s.code,
    name: s.name,
    glyph: s.glyph,
    desc: s.description,
    sop: s.sop_steps ?? [],
    avgWait: s.avg_wait_min,
    sop_pdf_url: s.sop_pdf_url,
    qr_url: s.qr_url,
    color_bg: s.color_bg,
    color_fg: s.color_fg,
    color_border: s.color_border,
    is_active: s.is_active,
  };
}

export default function KioskPage() {
  const [step, setStep] = useState<Step>('idle');
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [service, setService] = useState<Service | null>(null);
  const [ticket, setTicket] = useState<QueueItem | null>(null);

  useAutoFullscreen();

  const reset = () => {
    setStep('idle');
    setService(null);
    setTicket(null);
  };

  useEffect(() => {
    let alive = true;
    let errored = false;
    const load = async () => {
      try {
        const list = await serviceApi.list({ activeOnly: true });
        if (alive && Array.isArray(list) && list.length > 0) {
          setServices(list.map(fromApi));
        }
      } catch (err) {
        if (alive && !errored) {
          errored = true;
          toastError(err, 'Gagal memuat layanan, pakai data offline.');
        }
      }
    };
    load();
    const t = setInterval(load, SERVICES_REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (step !== 'ticket') return;
    const t = setTimeout(reset, TICKET_AUTO_RESET_MS);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <main className="live-shell">
      <div
        className="kiosk screen"
        data-screen-label="01 Kiosk"
        onClick={step === 'idle' ? () => setStep('select') : undefined}
      >
        {step === 'idle' && <IdleScreen />}
        {step === 'select' && (
          <ServiceSelector
            services={services}
            onPick={(svc) => {
              setService(svc);
              setStep('sop');
            }}
            onCancel={reset}
          />
        )}
        {step === 'sop' && service && (
          <SOPViewer
            svc={service}
            guestMode
            onConfirm={() => setStep('guest')}
            onBack={() => setStep('select')}
          />
        )}
        {step === 'guest' && service && (
          <GuestWait
            svc={service}
            onTicket={(t) => {
              setTicket(t);
              setStep('ticket');
            }}
            onBack={() => setStep('sop')}
          />
        )}
        {step === 'ticket' && ticket && service && (
          <TicketDisplay ticket={ticket} svc={service} onDone={reset} />
        )}
      </div>
    </main>
  );
}
