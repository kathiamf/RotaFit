export interface RoutePoint {
  lat: number;
  lng: number;
  t: number;
}

export type RunStatus = 'active' | 'paused' | 'finished';

export interface Run {
  id: string;
  startedAt: string;
  endedAt: string | null;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecPerKm: number | null;
  route: RoutePoint[];
  spotifyTrackName: string | null;
}

export interface SaveRunInput {
  startedAt: string;
  endedAt: string;
  distanceMeters: number;
  durationSeconds: number;
  route: RoutePoint[];
  spotifyTrackName: string | null;
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string | null;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
}
