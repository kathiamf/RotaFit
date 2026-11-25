import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { radius, spacing } from '@/theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tint?: string;
}

export function Card({ children, style, tint }: CardProps) {
  return (
    <GlassSurface
      tint={tint}
      radius={radius.lg}
      style={[styles.card, style]}
      intensity={28}
      opacity={0.56}
    >
      {children}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({ card: { padding: spacing.md } });
