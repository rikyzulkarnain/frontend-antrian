import type { ServiceType } from './queue';

export interface Service {
  key: ServiceType;
  code: string;
  name: string;
  description: string;
  glyph: string;
  color_bg: string;
  color_fg: string;
  color_border: string;
  sop_steps: string[];
  sop_pdf_url: string | null;
  qr_url: string | null;
  avg_wait_min: number;
  is_active: boolean;
  display_order: number;
  updated_at: string;
}

export interface ServiceCreate {
  key: string;
  code: string;
  name: string;
  description: string;
  glyph: string;
  color_bg: string;
  color_fg: string;
  color_border: string;
  sop_steps: string[];
  sop_pdf_url: string | null;
  qr_url: string | null;
  avg_wait_min: number;
  is_active: boolean;
  display_order: number;
}

export interface ServicePatch {
  name?: string;
  description?: string;
  glyph?: string;
  color_bg?: string;
  color_fg?: string;
  color_border?: string;
  sop_steps?: string[];
  sop_pdf_url?: string | null;
  qr_url?: string | null;
  avg_wait_min?: number;
  is_active?: boolean;
  display_order?: number;
}
