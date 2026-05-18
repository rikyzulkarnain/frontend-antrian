'use client';
import type { Service } from '@/lib/constants';

interface ServiceCardProps {
  service: Service;
  onPick: (svc: Service) => void;
}

export function ServiceCard({ service, onPick }: ServiceCardProps) {
  return (
    <div className="service-card" data-key={service.key} onClick={() => onPick(service)}>
      <div className="glyph">{service.glyph}</div>
      <h3>{service.name}</h3>
      <p className="desc">{service.desc}</p>
      <div className="meta">
        <span>Estimasi tunggu</span>
        <span>
          <span className="big">~{service.avgWait}m</span>
        </span>
      </div>
    </div>
  );
}
