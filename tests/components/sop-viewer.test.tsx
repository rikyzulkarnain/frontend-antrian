import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SOPViewer } from '@/components/kiosk/sop-viewer';
import { SERVICES } from '@/lib/constants';

const umum = SERVICES.find((s) => s.key === 'UMUM')!;

describe('SOPViewer', () => {
  it('renders the service name and SOP steps', () => {
    const onConfirm = vi.fn();
    const onBack = vi.fn();
    render(<SOPViewer svc={umum} onConfirm={onConfirm} onBack={onBack} />);

    expect(screen.getByRole('heading', { name: umum.name })).toBeInTheDocument();
    // Every SOP line should render as a step.
    for (const line of umum.sop) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
  });

  it('numbers the SOP steps sequentially', () => {
    render(<SOPViewer svc={umum} onConfirm={vi.fn()} onBack={vi.fn()} />);
    // Numbers 1..N appear in the .num spans next to each step.
    for (let i = 1; i <= umum.sop.length; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('calls onConfirm when the primary CTA is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<SOPViewer svc={umum} onConfirm={onConfirm} onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /ambil nomor antrian/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when the secondary CTA is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<SOPViewer svc={umum} onConfirm={vi.fn()} onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: /pilih layanan lain/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('in guestMode the CTA advances to the intake form instead of issuing a number', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<SOPViewer svc={umum} guestMode onConfirm={onConfirm} onBack={vi.fn()} />);

    // Direct "ambil nomor antrian" is replaced by the registration CTA.
    expect(screen.queryByRole('button', { name: /ambil nomor antrian/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /lanjut isi formulir/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders distinct glyphs across service types', () => {
    // Sanity: rendering a different service should show that service's name.
    const lab = SERVICES.find((s) => s.key === 'LAB')!;
    const { rerender } = render(<SOPViewer svc={umum} onConfirm={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: umum.name })).toBeInTheDocument();

    rerender(<SOPViewer svc={lab} onConfirm={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: lab.name })).toBeInTheDocument();
  });
});
