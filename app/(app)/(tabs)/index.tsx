import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/StateViews';
import { SpotifyPlayerCard } from '@/components/spotify/SpotifyPlayerCard';
import { useAuth } from '@/context/AuthContext';
import { useWeeklyStats } from '@/hooks/useRuns';
import { spacing, useTheme } from '@/theme';
import { formatDistance, formatDuration } from '@/utils/geo';
import { greetingForHour } from '@/utils/greeting';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useWeeklyStats();
  const firstName = String(user?.user_metadata?.full_name ?? '').split(' ')[0];
  if (isError)
    return <ErrorState message={error.message} onRetry={() => void refetch()} />;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={theme.primary}
        />
      }
    >
      <Text style={[styles.greeting, { color: theme.muted }]}>
        {greetingForHour(new Date().getHours())}
        {firstName ? `, ${firstName}` : ''} 👋
      </Text>
      <Text style={[styles.title, { color: theme.text }]}>Pronto para correr?</Text>
      <Card style={styles.statsCard} tint={theme.primarySoft}>
        <Text style={[styles.statsTitle, { color: theme.text }]}>Esta semana</Text>
        {isLoading ? (
          <Text style={{ color: theme.muted }}>Carregando...</Text>
        ) : (
          <View style={styles.statsRow}>
            <Metric
              icon="walk"
              label="Distância"
              value={formatDistance(stats?.totalDistanceMeters ?? 0)}
            />
            <Metric
              icon="time"
              label="Tempo"
              value={formatDuration(stats?.totalDurationSeconds ?? 0)}
            />
            <Metric
              icon="fitness"
              label="Corridas"
              value={String(stats?.runCount ?? 0)}
            />
          </View>
        )}
      </Card>
      <SpotifyPlayerCard />
      <Button
        title="Começar corrida"
        onPress={() => router.push('/run/active')}
        style={styles.startButton}
      />
      <Text style={[styles.caption, { color: theme.muted }]}>
        Seu próximo percurso começa aqui.
      </Text>
    </ScrollView>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={20} color={theme.primary} />
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 110, gap: spacing.md },
  greeting: { fontSize: 15, marginTop: spacing.sm },
  title: { fontSize: 28, fontWeight: '800' },
  statsCard: { gap: spacing.md },
  statsTitle: { fontSize: 17, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { alignItems: 'center', gap: 5, flex: 1 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  metricLabel: { fontSize: 12 },
  startButton: { marginTop: spacing.sm },
  caption: { textAlign: 'center', fontSize: 12 },
});
