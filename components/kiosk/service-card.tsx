'use client';
import { getSvcBg, getSvcBorder, getSvcFg, type Service } from '@/lib/constants';

interface ServiceCardProps {
  service: Service;
  onPick: (svc: Service) => void;
}

export function ServiceCard({ service, onPick }: ServiceCardProps) {
  const bg = service.color_bg ?? getSvcBg(service.key);
  const fg = service.color_fg ?? getSvcFg(service.key);
  const border = service.color_border ?? getSvcBorder(service.key);
  return (
    <div className="service-card" data-key={service.key} onClick={() => onPick(service)}>
      <div className="glyph" style={{ background: bg, color: fg, borderColor: border }}>
        {service.glyph}
      </div>
      <h3>{service.name}</h3>
      <p className="desc">{service.desc}</p>
      <div className="meta">
        <span>Ketuk untuk lanjut</span>
        <span>
          <span className="big" aria-hidden="true">→</span>
        </span>
      </div>
    </div>
  );
}
