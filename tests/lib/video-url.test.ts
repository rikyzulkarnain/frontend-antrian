import { describe, expect, it } from 'vitest';
import { deliveryVideoUrl, driveFileId, youtubeVideoId } from '@/lib/video-url';

const CLOUDINARY = 'https://res.cloudinary.com/demo/video/upload';
const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz';
const DIRECT = `https://drive.usercontent.google.com/download?id=${ID}&export=download&confirm=t`;

describe('youtubeVideoId', () => {
  const YT = 'dQw4w9WgXcQ';

  it('reads the id from every common YouTube link shape', () => {
    expect(youtubeVideoId(`https://youtu.be/${YT}`)).toBe(YT);
    expect(youtubeVideoId(`https://youtu.be/${YT}?t=30`)).toBe(YT);
    expect(youtubeVideoId(`https://www.youtube.com/watch?v=${YT}`)).toBe(YT);
    expect(youtubeVideoId(`https://www.youtube.com/watch?v=${YT}&list=PL123`)).toBe(YT);
    expect(youtubeVideoId(`https://www.youtube.com/embed/${YT}`)).toBe(YT);
    expect(youtubeVideoId(`https://www.youtube.com/shorts/${YT}`)).toBe(YT);
    expect(youtubeVideoId(`https://www.youtube.com/live/${YT}`)).toBe(YT);
    expect(youtubeVideoId(`https://m.youtube.com/watch?v=${YT}`)).toBe(YT);
    expect(youtubeVideoId(`https://www.youtube-nocookie.com/embed/${YT}`)).toBe(YT);
  });

  it('accepts a bare 11-character id', () => {
    expect(youtubeVideoId(YT)).toBe(YT);
    expect(youtubeVideoId(`  ${YT}  `)).toBe(YT);
  });

  it('returns null for non-YouTube input', () => {
    expect(youtubeVideoId('https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view')).toBeNull();
    expect(youtubeVideoId('https://example.org/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(youtubeVideoId('bukan-url')).toBeNull();
    expect(youtubeVideoId('')).toBeNull();
  });

  it('rejects YouTube URLs without a well-formed id', () => {
    expect(youtubeVideoId('https://www.youtube.com/watch?v=tooshort')).toBeNull();
    expect(youtubeVideoId('https://www.youtube.com/results?search_query=antrian')).toBeNull();
  });
});

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
