import { describe, expect, it } from 'vitest';
import { deliveryVideoUrl, driveFileId } from '@/lib/video-url';

const CLOUDINARY = 'https://res.cloudinary.com/demo/video/upload';
const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz';
const DIRECT = `https://drive.usercontent.google.com/download?id=${ID}&export=download&confirm=t`;

describe('driveFileId', () => {
  it('reads the id from a /file/d/ share link', () => {
    expect(driveFileId(`https://drive.google.com/file/d/${ID}/view?usp=sharing`)).toBe(ID);
  });

  it('reads the id from an open?id= link', () => {
    expect(driveFileId(`https://drive.google.com/open?id=${ID}`)).toBe(ID);
  });

  it('reads the id from a uc?export=download link', () => {
    expect(driveFileId(`https://drive.google.com/uc?export=download&id=${ID}`)).toBe(ID);
  });

  it('returns null for non-Drive URLs', () => {
    expect(driveFileId(`${CLOUDINARY}/v1/clip.mp4`)).toBeNull();
    expect(driveFileId('https://example.org/clip.mp4')).toBeNull();
  });
});

describe('deliveryVideoUrl', () => {
  it('rewrites any Drive share link to a direct download URL', () => {
    expect(deliveryVideoUrl(`https://drive.google.com/file/d/${ID}/view?usp=sharing`)).toBe(DIRECT);
    expect(deliveryVideoUrl(`https://drive.google.com/open?id=${ID}`)).toBe(DIRECT);
  });

  it('is idempotent for an already-direct Drive URL', () => {
    expect(deliveryVideoUrl(DIRECT)).toBe(DIRECT);
  });

  it('injects q_auto into a plain Cloudinary delivery URL', () => {
    expect(deliveryVideoUrl(`${CLOUDINARY}/v1779000695/sistem-antrian/videos/clip.mp4`)).toBe(
      `${CLOUDINARY}/q_auto/v1779000695/sistem-antrian/videos/clip.mp4`,
    );
  });

  it('leaves an already-transformed Cloudinary URL untouched', () => {
    const url = `${CLOUDINARY}/q_auto,f_auto/v1779000695/clip.mp4`;
    expect(deliveryVideoUrl(url)).toBe(url);
  });

  it('leaves unrelated URLs untouched', () => {
    const url = 'https://cdn.example.org/video/upload/clip.mp4';
    expect(deliveryVideoUrl(url)).toBe(url);
  });

  it('leaves Cloudinary image URLs untouched', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg';
    expect(deliveryVideoUrl(url)).toBe(url);
  });
});
