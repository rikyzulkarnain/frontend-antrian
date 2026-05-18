'use client';
import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, children, footer, maxWidth = 480 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.4)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 14,
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        }}
      >
        <header style={{ padding: '16px 18px', borderBottom: '1px solid var(--line-2)' }}>
          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 600 }}>{title}</h3>
        </header>
        <div style={{ padding: 18 }}>{children}</div>
        {footer && (
          <footer
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--line-2)',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
