import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { EmptyState, ErrorState, LoadingView } from '@/components/StateViews';
import { useDeleteRun, useRuns } from '@/hooks/useRuns';
import { spacing, useTheme } from '@/theme';
import { formatDistance, formatDuration } from '@/utils/geo';
import { errorMessage } from '@/utils/errors';
import type { Run } from '@/types';

export default function HistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const runs = useRuns();
  const remove = useDeleteRun();
  const confirmDelete = (run: Run) =>
    Alert.alert('Excluir corrida', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () =>
          remove.mutate(run.id, {
            onError: (error) => Alert.alert('Erro', errorMessage(error)),
          }),
      },
    ]);

  if (runs.isLoading) return <LoadingView />;
  if (runs.isError) {
    return (
      <ErrorState message={runs.error.message} onRetry={() => void runs.refetch()} />
    );
  }
  if (!runs.data?.length) {
    return (
      <View style={styles.empty}>
        <EmptyState
          icon="walk-outline"
          title="Ainda sem corridas"
          message="Sua primeira corrida aparecerá aqui."
        />
      </View>
    );
  }
  return (
    <FlatList
      data={runs.data}
      keyExtractor={(run) => run.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text style={[styles.title, { color: theme.text }]}>Suas corridas</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/run/${item.id}`)}
        >
          <Card style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.dateBlock}>
                <Text style={[styles.date, { color: theme.text }]}>
                  {new Date(item.startedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={[styles.time, { color: theme.muted }]}>
                  {new Date(item.startedAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Excluir corrida"
                onPress={() => confirmDelete(item)}
                hitSlop={10}
              >
                <Ionicons name="trash-outline" size={20} color={theme.danger} />
              </Pressable>
            </View>
            <View style={styles.metrics}>
              <Metric label="Distância" value={formatDistance(item.distanceMeters)} />
              <Metric label="Tempo" value={formatDuration(item.durationSeconds)} />
              <Ionicons name="chevron-forward" size={18} color={theme.muted} />
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: 110, gap: spacing.md },
  empty: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: spacing.sm },
  card: { gap: spacing.md },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBlock: { gap: 2 },
  date: { fontSize: 16, fontWeight: '700' },
  time: { fontSize: 13 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  metricValue: { fontSize: 16, fontWeight: '700' },
  metricLabel: { fontSize: 12, marginTop: 2 },
});
