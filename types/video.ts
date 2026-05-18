export type VideoTarget = 'kiosk' | 'display' | 'both';

export interface Video {
  id: string;
  title: string;
  url: string;
  target_screen: VideoTarget;
  duration_seconds: number | null;
  display_order: number;
  is_active: boolean;
  uploaded_at: string;
  uploaded_by: string | null;
}
