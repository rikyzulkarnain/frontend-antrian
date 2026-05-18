'use client';
import { useClock } from '@/hooks/useClock';
import { fmtTime } from '@/lib/format';

export function MobileStatusBar() {
  const clock = useClock();
  return (
    <div className="mobile-status">
      <span>{fmtTime(clock)}</span>
      <div className="right">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
          <path d="M0 8h2v3H0zM4 6h2v5H4zM8 4h2v7H8zM12 1h2v10h-2z" />
        </svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M1 3.5a8 8 0 0 1 12 0M3 5.5a5 5 0 0 1 8 0M5 7.5a2 2 0 0 1 4 0" strokeLinecap="round" />
        </svg>
        <svg width="22" height="11" viewBox="0 0 24 11" fill="none">
          <rect x=".5" y=".5" width="20" height="10" rx="2.5" stroke="currentColor" />
          <rect x="22" y="3.5" width="1.5" height="4" rx=".5" fill="currentColor" />
          <rect x="2" y="2" width="16" height="7" rx="1" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
