import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { radius, spacing, useTheme } from '@/theme';
import type { RoutePoint } from '@/types';

interface RoutePathProps {
  route: RoutePoint[];
  height?: number;
  live?: boolean;
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    path += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6},`;
    path += ` ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6},`;
    path += ` ${p2.x} ${p2.y}`;
  }
  return path;
}

export function RoutePath({ route, height = 240, live = false }: RoutePathProps) {
  const { theme } = useTheme();
  const width = 340;
  const padding = 32;

  if (route.length < 2) {
    return (
      <GlassSurface radius={radius.lg} style={[styles.wrap, { height }]} intensity={20}>
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={28} color={theme.muted} />
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            {live ? 'Localizando... ande um pouco para ver a rota' : 'Sem pontos de rota'}
          </Text>
        </View>
      </GlassSurface>
    );
  }
  const lats = route.map((point) => point.lat);
  const lngs = route.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 0.0003;
  const spanLng = maxLng - minLng || 0.0003;
  const scale = Math.min(
    (width - padding * 2) / spanLng,
    (height - padding * 2) / spanLat,
  );
  const offsetX = (width - spanLng * scale) / 2;
  const offsetY = (height - spanLat * scale) / 2;
  const points = route.map((point) => ({
    x: offsetX + (point.lng - minLng) * scale,
    y: height - offsetY - (point.lat - minLat) * scale,
  }));
  const d = smoothPath(points);
  const start = points[0];
  const end = points[points.length - 1];
  const dots = [];
  for (let x = padding; x < width - padding + 1; x += 28) {
    for (let y = padding; y < height - padding + 1; y += 28) dots.push({ x, y });
  }

  return (
    <GlassSurface radius={radius.lg} style={[styles.wrap, { height }]} intensity={20}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <SvgGradient id="trail" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.success} stopOpacity={1} />
            <Stop offset="1" stopColor={theme.primary} stopOpacity={1} />
          </SvgGradient>
        </Defs>
        {dots.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={1.1}
            fill={theme.muted}
            opacity={0.18}
          />
        ))}
        <Path
          d={d}
          fill="none"
          stroke="url(#trail)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx={start.x}
          cy={start.y}
          r={7}
          fill={theme.success}
          stroke={theme.surface}
          strokeWidth={2}
        />
        {live ? (
          <>
            <Circle cx={end.x} cy={end.y} r={11} fill={theme.primary} opacity={0.25} />
            <Circle
              cx={end.x}
              cy={end.y}
              r={6}
              fill={theme.primary}
              stroke={theme.surface}
              strokeWidth={2}
            />
          </>
        ) : (
          <Circle
            cx={end.x}
            cy={end.y}
            r={7}
            fill={theme.danger}
            stroke={theme.surface}
            strokeWidth={2}
          />
        )}
      </Svg>
      <LinearGradient
        colors={[
          'transparent',
          theme.mode === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.06)',
        ]}
        style={styles.floorShadow}
        pointerEvents="none"
      />
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', justifyContent: 'center' },
  emptyState: { alignItems: 'center', gap: spacing.xs, padding: spacing.lg },
  emptyText: { fontSize: 13, textAlign: 'center' },
  floorShadow: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 },
});
