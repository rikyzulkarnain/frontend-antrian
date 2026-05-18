import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SKMView } from '@/components/mobile/skm-view';
import { SERVICES, type Counter } from '@/lib/constants';
import type { QueueItem } from '@/types/queue';

const baseTicket: QueueItem = {
  id: 'q1',
  queue_number: 'A-01',
  service_type: 'UMUM',
  status: 'completed',
  counter_id: 1,
  staff: 'Sari W.',
  rating: null,
  feedback: null,
  created_at: '2026-05-16T08:00:00Z',
  called_at: '2026-05-16T08:05:00Z',
  completed_at: '2026-05-16T08:10:00Z',
};

const counter: Counter = {
  id: 1,
  name: 'Loket 1',
  service: 'UMUM',
  active: true,
  staff: 'Sari W.',
};

const svc = SERVICES.find((s) => s.key === 'UMUM')!;

describe('SKMView', () => {
  it('renders 5 star buttons and the ticket header', () => {
    render(<SKMView ticket={baseTicket} svc={svc} counter={counter} />);
    expect(screen.getByText(/survei kepuasan masyarakat/i)).toBeInTheDocument();
    expect(screen.getByText('A-01')).toBeInTheDocument();
    // 5 star buttons — match the aria-label pattern.
    expect(screen.getAllByRole('button', { name: /beri \d bintang/i })).toHaveLength(5);
  });

  it('disables submit until a rating is chosen', () => {
    render(<SKMView ticket={baseTicket} svc={svc} counter={counter} />);
    const submit = screen.getByRole('button', { name: /kirim penilaian/i });
    expect(submit).toBeDisabled();
  });

  it('submits rating and shows the thank-you state', async () => {
    const user = userEvent.setup();
    render(<SKMView ticket={baseTicket} svc={svc} counter={counter} />);

    await user.click(screen.getByRole('button', { name: /beri 5 bintang/i }));

    const submit = screen.getByRole('button', { name: /kirim penilaian/i });
    expect(submit).not.toBeDisabled();
    await user.click(submit);

    // Thank-you screen replaces the form.
    expect(await screen.findByText(/terima kasih!/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /kirim penilaian/i })).not.toBeInTheDocument();
  });

  it('lets the user toggle feedback tags', async () => {
    const user = userEvent.setup();
    render(<SKMView ticket={baseTicket} svc={svc} counter={counter} />);

    const tag = screen.getByRole('button', { name: /petugas ramah/i });
    expect(tag).not.toHaveClass('chip-ink');
    await user.click(tag);
    // After click, the chip-ink class is applied (selected state).
    expect(tag.className).toContain('chip-ink');

    // Toggle off.
    await user.click(tag);
    expect(tag.className).not.toContain('chip-ink');
  });

  it('skip button jumps directly to the thank-you state without submitting', async () => {
    const user = userEvent.setup();
    // Override handler to fail so we'd notice a submit firing.
    const { server } = await import('../msw/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.post('http://localhost:8080/api/v1/queues/:id/rating', () =>
        HttpResponse.json({ error: { code: 'X', message: 'should not be called' } }, { status: 500 }),
      ),
    );

    render(<SKMView ticket={baseTicket} svc={svc} counter={counter} />);

    // Find the "Lewati" button inside the form (not the disabled submit).
    const skip = screen.getByRole('button', { name: /lewati/i });
    await user.click(skip);

    const thanks = await screen.findByText(/terima kasih!/i);
    expect(within(thanks.closest('div')!).queryByText(/server/i)).toBeNull();
  });
});
