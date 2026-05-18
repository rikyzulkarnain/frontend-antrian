import { describe, expect, it } from 'vitest';
import { fmtDate, fmtTime, fmtTimeSec } from '@/lib/format';

describe('fmtTime', () => {
  it('zero-pads single-digit hours and minutes', () => {
    const d = new Date(2026, 4, 16, 7, 3);
    expect(fmtTime(d)).toBe('07:03');
  });

  it('accepts numeric timestamps', () => {
    const d = new Date(2026, 4, 16, 22, 45);
    expect(fmtTime(d.getTime())).toBe('22:45');
  });
});

describe('fmtTimeSec', () => {
  it('includes seconds, all zero-padded', () => {
    const d = new Date(2026, 4, 16, 8, 5, 9);
    expect(fmtTimeSec(d)).toBe('08:05:09');
  });
});

describe('fmtDate', () => {
  it('renders day name + Indonesian month + year', () => {
    // 16 Mei 2026 = Sabtu
    const d = new Date(2026, 4, 16);
    expect(fmtDate(d)).toBe('Sabtu, 16 Mei 2026');
  });

  it('handles January (month index 0)', () => {
    const d = new Date(2026, 0, 1);
    // 1 Jan 2026 = Kamis
    expect(fmtDate(d)).toBe('Kamis, 1 Januari 2026');
  });
});
