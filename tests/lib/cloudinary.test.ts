import { describe, expect, it } from 'vitest';
import { deliveryVideoUrl } from '@/lib/cloudinary';

const BASE = 'https://res.cloudinary.com/demo/video/upload';

describe('deliveryVideoUrl', () => {
  it('injects q_auto into a plain Cloudinary delivery URL', () => {
    expect(deliveryVideoUrl(`${BASE}/v1779000695/sistem-antrian/videos/clip.mp4`)).toBe(
      `${BASE}/q_auto/v1779000695/sistem-antrian/videos/clip.mp4`,
    );
  });

  it('injects q_auto when the URL carries no version segment', () => {
    expect(deliveryVideoUrl(`${BASE}/sistem-antrian/videos/clip.mp4`)).toBe(
      `${BASE}/q_auto/sistem-antrian/videos/clip.mp4`,
    );
  });

  it('leaves an already-transformed URL untouched', () => {
    const url = `${BASE}/q_auto,f_auto/v1779000695/clip.mp4`;
    expect(deliveryVideoUrl(url)).toBe(url);
  });

  it('leaves non-Cloudinary URLs untouched', () => {
    const url = 'https://cdn.example.org/video/upload/clip.mp4';
    expect(deliveryVideoUrl(url)).toBe(url);
  });

  it('leaves Cloudinary image URLs untouched', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg';
    expect(deliveryVideoUrl(url)).toBe(url);
  });
});
