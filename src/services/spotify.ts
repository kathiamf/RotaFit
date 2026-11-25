import type { SpotifyTrack } from '@/types';

const BASE = 'https://api.spotify.com/v1';

export class SpotifyApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'SpotifyApiError';
  }
}

async function call(accessToken: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init.headers },
  });
  if (response.status === 204 || response.status === 202) return null;
  if (response.status === 404) {
    throw new SpotifyApiError(
      404,
      'Abra o Spotify e toque uma música antes de controlar por aqui.',
    );
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'object' &&
      body.error !== null &&
      'message' in body.error &&
      typeof body.error.message === 'string'
        ? body.error.message
        : 'Não foi possível falar com o Spotify.';
    throw new SpotifyApiError(response.status, message);
  }
  return response.status === 200 ? response.json() : null;
}

export async function getNowPlaying(accessToken: string): Promise<SpotifyTrack | null> {
  const data = await call(accessToken, '/me/player/currently-playing');
  if (!data || !data.item) return null;
  return {
    id: data.item.id,
    name: data.item.name,
    artist: (data.item.artists ?? [])
      .map((artist: { name: string }) => artist.name)
      .join(', '),
    albumArt: data.item.album?.images?.[0]?.url ?? null,
    isPlaying: Boolean(data.is_playing),
    progressMs: data.progress_ms ?? 0,
    durationMs: data.item.duration_ms ?? 0,
  };
}

export const pausePlayback = (token: string) =>
  call(token, '/me/player/pause', { method: 'PUT' });
export const resumePlayback = (token: string) =>
  call(token, '/me/player/play', { method: 'PUT' });
export const skipNext = (token: string) =>
  call(token, '/me/player/next', { method: 'POST' });
export const skipPrevious = (token: string) =>
  call(token, '/me/player/previous', { method: 'POST' });
