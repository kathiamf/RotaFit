import type { RoutePoint } from '@/types';

const EARTH_RADIUS_M = 6_371_000;
const MAX_SPEED_MPS = 10;
const toRad = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineMeters(a: RoutePoint, b: RoutePoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isPlausibleJump(prev: RoutePoint, next: RoutePoint): boolean {
  const elapsedMs = next.t - prev.t;
  if (elapsedMs <= 0) return false;
  return haversineMeters(prev, next) / (elapsedMs / 1000) <= MAX_SPEED_MPS;
}

export function routeDistanceMeters(route: RoutePoint[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i += 1) {
    const previous = route[i - 1];
    const next = route[i];
    if (isPlausibleJump(previous, next)) total += haversineMeters(previous, next);
  }
  return total;
}

export function averagePaceSecPerKm(
  distanceMeters: number,
  durationSeconds: number,
): number | null {
  if (distanceMeters <= 0) return null;
  return durationSeconds / (distanceMeters / 1000);
}

export function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(2).replace('.', ',')} km`
    : `${Math.round(meters)} m`;
}

const pad = (value: number) => String(Math.floor(value)).padStart(2, '0');

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(remainder)}`
    : `${pad(minutes)}:${pad(remainder)}`;
}

export function formatPace(secondsPerKm: number | null): string {
  if (secondsPerKm === null || !Number.isFinite(secondsPerKm)) return '—';
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}'${String(seconds).padStart(2, '0')}"/km`;
}

export function estimateCalories(
  _distanceMeters: number,
  durationSeconds: number,
  weightKg = 70,
): number {
  if (durationSeconds <= 0 || weightKg <= 0) return 0;
  return Math.round(9.8 * weightKg * (durationSeconds / 3600));
}

export function simplifyRoute(route: RoutePoint[], maxPoints = 200): RoutePoint[] {
  if (!Number.isInteger(maxPoints) || maxPoints < 2) {
    throw new RangeError('maxPoints deve ser um inteiro maior ou igual a 2.');
  }
  if (route.length <= maxPoints) return route;
  const result: RoutePoint[] = [];
  const step = (route.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i += 1) {
    result.push(route[Math.round(i * step)]);
  }
  return result;
}
