import type { RoutePoint } from '@/types';
import {
  averagePaceSecPerKm,
  estimateCalories,
  formatDistance,
  formatDuration,
  formatPace,
  haversineMeters,
  isPlausibleJump,
  routeDistanceMeters,
  simplifyRoute,
} from '@/utils/geo';

const point = (lat: number, lng: number, t = 0): RoutePoint => ({ lat, lng, t });

describe('geolocalização', () => {
  it('distância entre pontos iguais é zero', () => {
    expect(haversineMeters(point(0, 0), point(0, 0))).toBe(0);
  });
  it('mede aproximadamente 111 km por grau de latitude', () => {
    expect(haversineMeters(point(0, 0), point(1, 0))).toBeGreaterThan(110_000);
    expect(haversineMeters(point(0, 0), point(1, 0))).toBeLessThan(112_000);
  });
  it('calcula um trecho conhecido em Brasília', () => {
    const distance = haversineMeters(
      point(-15.7997, -47.8645),
      point(-15.7969, -47.8756),
    );
    expect(distance).toBeGreaterThan(1100);
    expect(distance).toBeLessThan(1300);
  });
  it('aceita velocidade de corrida inferior a 10 m/s', () => {
    expect(isPlausibleJump(point(0, 0, 0), point(0, 0.0001, 2000))).toBe(true);
  });
  it('aceita a velocidade limite de 10 m/s', () => {
    const start = point(0, 0, 0);
    const end = point(0, 0.0001, 0);
    const elapsedMs = (haversineMeters(start, end) / 10) * 1000;
    expect(isPlausibleJump(start, { ...end, t: elapsedMs })).toBe(true);
  });
  it('rejeita salto de GPS acima de 10 m/s', () => {
    expect(isPlausibleJump(point(0, 0, 0), point(0, 0.01, 1000))).toBe(false);
  });
  it('rejeita timestamps iguais ou regressivos', () => {
    expect(isPlausibleJump(point(0, 0, 100), point(0, 0, 100))).toBe(false);
    expect(isPlausibleJump(point(0, 0, 100), point(0, 0, 50))).toBe(false);
  });
  it('soma apenas segmentos plausíveis', () => {
    const route = [point(0, 0, 0), point(0, 0.0001, 2000), point(0, 0.01, 3000)];
    expect(routeDistanceMeters(route)).toBeCloseTo(
      haversineMeters(route[0], route[1]),
      6,
    );
  });
  it('rota vazia ou unitária tem distância zero', () => {
    expect(routeDistanceMeters([])).toBe(0);
    expect(routeDistanceMeters([point(0, 0)])).toBe(0);
  });
  it('calcula ritmo médio e lida com distância zero', () => {
    expect(averagePaceSecPerKm(5000, 1500)).toBe(300);
    expect(averagePaceSecPerKm(0, 300)).toBeNull();
  });
  it('formata distância em metros e quilômetros localizados', () => {
    expect(formatDistance(850)).toBe('850 m');
    expect(formatDistance(1500)).toBe('1,50 km');
  });
  it('formata duração curta e com horas', () => {
    expect(formatDuration(90)).toBe('01:30');
    expect(formatDuration(3725)).toBe('01:02:05');
  });
  it('formata ritmo e valores não disponíveis', () => {
    expect(formatPace(330)).toBe(`5'30"/km`);
    expect(formatPace(null)).toBe('—');
    expect(formatPace(Number.NaN)).toBe('—');
  });
  it('estima calorias de forma proporcional ao tempo', () => {
    expect(estimateCalories(5000, 0)).toBe(0);
    expect(estimateCalories(5000, 3600)).toBeGreaterThan(estimateCalories(5000, 1800));
  });
  it('simplifica rota e preserva primeiro e último pontos', () => {
    const route = Array.from({ length: 401 }, (_, i) => point(0, i, i));
    const simplified = simplifyRoute(route, 100);
    expect(simplified).toHaveLength(100);
    expect(simplified[0]).toBe(route[0]);
    expect(simplified[99]).toBe(route[400]);
  });
  it('recusa limite de simplificação inválido', () => {
    expect(() => simplifyRoute([], 1)).toThrow(RangeError);
  });
});
