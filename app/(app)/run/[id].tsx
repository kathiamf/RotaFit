import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState, LoadingView } from '@/components/StateViews';
import { RoutePath } from '@/components/RoutePath';
import { useDeleteRun, useRun } from '@/hooks/useRuns';
import { spacing, useTheme } from '@/theme';
import {
  estimateCalories,
  formatDistance,
  formatDuration,
  formatPace,
} from '@/utils/geo';
import { errorMessage } from '@/utils/errors';

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const query = useRun(id);
  const remove = useDeleteRun();
  if (query.isLoading) return <LoadingView />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        message={query.error?.message ?? 'Corrida não encontrada.'}
        onRetry={() => void query.refetch()}
      />
    );
  }
  const run = query.data;
  const confirmDelete = () =>
    Alert.alert('Excluir corrida', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () =>
          remove.mutate(run.id, {
            onSuccess: () => router.back(),
            onError: (error) => Alert.alert('Erro', errorMessage(error)),
          }),
      },
    ]);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.date, { color: theme.muted }]}>
        {new Date(run.startedAt).toLocaleString('pt-BR')}
      </Text>
      <RoutePath route={run.route} height={280} />
      <Card style={styles.card}>
        <Metric label="Distância" value={formatDistance(run.distanceMeters)} />
        <Metric label="Duração" value={formatDuration(run.durationSeconds)} />
        <Metric label="Ritmo médio" value={formatPace(run.avgPaceSecPerKm)} />
        <Metric
          label="Calorias (estimativa)"
          value={`${estimateCalories(run.distanceMeters, run.durationSeconds)} kcal`}
        />
      </Card>
      {run.spotifyTrackName ? (
        <Card>
          <Text style={{ color: theme.text }}>♫ {run.spotifyTrackName}</Text>
        </Card>
      ) : null}
      <Button
        title="Excluir corrida"
        variant="danger"
        onPress={confirmDelete}
        style={styles.delete}
      />
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  date: { fontSize: 14 },
  card: { gap: spacing.md },
  metric: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 14 },
  metricValue: { fontSize: 16, fontWeight: '700' },
  delete: { marginTop: spacing.sm },
});
