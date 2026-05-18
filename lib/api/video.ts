import type { Video, VideoTarget } from '@/types/video';
import { http } from '../api';

export interface VideoInput {
  title: string;
  url: string;
  target_screen: VideoTarget;
  duration_seconds?: number | null;
  display_order?: number;
  is_active?: boolean;
}

export interface UploadSignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder?: string;
  upload_preset?: string;
}

export const videoApi = {
  list(target?: VideoTarget): Promise<Video[]> {
    const qs = target ? `?target=${encodeURIComponent(target)}` : '';
    return http.get<Video[]>(`/videos${qs}`);
  },

  create(input: VideoInput): Promise<Video> {
    return http.post<Video>('/videos', input);
  },

  update(id: string, input: Partial<VideoInput>): Promise<Video> {
    return http.patch<Video>(`/videos/${encodeURIComponent(id)}`, input);
  },

  remove(id: string): Promise<{ ok: true }> {
    return http.delete<{ ok: true }>(`/videos/${encodeURIComponent(id)}`);
  },

  uploadSignature(): Promise<UploadSignature> {
    return http.post<UploadSignature>('/videos/upload-signature');
  },
};
