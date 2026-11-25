import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassSurface, glassShadow } from '@/components/glass/GlassSurface';
import { RoutePath } from '@/components/RoutePath';
import { SpotifyPlayerCard } from '@/components/spotify/SpotifyPlayerCard';
import { useNowPlaying } from '@/hooks/useSpotifyPlayer';
import { useRunTracker } from '@/hooks/useRunTracker';
import { useSaveRun } from '@/hooks/useRuns';
import { radius, spacing, useTheme } from '@/theme';
import { errorMessage } from '@/utils/errors';
import { formatDistance, formatDuration, formatPace } from '@/utils/geo';

export default function ActiveRunScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const tracker = useRunTracker();
  const saveRun = useSaveRun();
  const { data: nowPlaying } = useNowPlaying();
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    setStarting(true);
    try {
      const granted = await tracker.start();
      if (!granted) {
        Alert.alert(
          'Permissão de localização necessária',
          'O RotaFit precisa da sua localização para registrar a rota da corrida. Ative a permissão nas configurações do aparelho.',
        );
      }
    } catch (error) {
      Alert.alert('Não foi possível iniciar o GPS', errorMessage(error));
    } finally {
      setStarting(false);
    }
  }

  function handleFinish() {
    Alert.alert('Finalizar corrida', 'Deseja encerrar e salvar esta corrida?', [
      { text: 'Continuar correndo', style: 'cancel' },
      {
        text: 'Finalizar',
        style: 'destructive',
        onPress: () => {
          const input = tracker.finish(
            nowPlaying?.name ? `${nowPlaying.name} — ${nowPlaying.artist}` : null,
          );
          if (!input || input.distanceMeters === 0) {
            router.back();
            return;
          }
          saveRun.mutate(input, {
            onSuccess: (id) => router.replace(`/run/${id}`),
            onError: (error) =>
              Alert.alert('Não foi possível salvar', errorMessage(error)),
          });
        },
      },
    ]);
  }

  function handleDiscard() {
    Alert.alert('Descartar corrida', 'Os dados desta corrida serão perdidos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          tracker.reset();
          router.back();
        },
      },
    ]);
  }

  if (tracker.status === 'idle') {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="walk" size={64} color={theme.primary} />
        <Text style={[styles.readyTitle, { color: theme.text }]}>
          Pronto para começar?
        </Text>
        <Text style={[styles.readyText, { color: theme.muted }]}>
          Vamos usar sua localização para acompanhar a rota, a distância e o ritmo em
          tempo real.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleStart()}
          disabled={starting}
          style={styles.startWrap}
        >
          <GlassSurface
            tint={theme.primary}
            radius={radius.pill}
            style={[styles.startBtn, glassShadow(theme.primary)]}
          >
            <Text style={[styles.startText, { color: theme.onPrimary }]}>
              {starting ? 'Localizando...' : 'Começar corrida'}
            </Text>
          </GlassSurface>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={[styles.cancel, { color: theme.muted }]}>Cancelar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <RoutePath route={tracker.route} height={280} live />
      <View style={styles.stats}>
        <GlassSurface radius={radius.lg} style={styles.statsCard} intensity={30}>
          <Stat label="Distância" value={formatDistance(tracker.distanceMeters)} big />
          <View style={styles.statsRow}>
            <Stat label="Tempo" value={formatDuration(tracker.elapsedSeconds)} />
            <Stat label="Ritmo" value={formatPace(tracker.pace)} />
          </View>
        </GlassSurface>
        <SpotifyPlayerCard />
        <View style={styles.controls}>
          {tracker.status === 'active' ? (
            <ControlButton
              icon="pause"
              label="Pausar"
              onPress={tracker.pause}
              tint={theme.primary}
            />
          ) : (
            <ControlButton
              icon="play"
              label="Retomar"
              onPress={() =>
                void tracker
                  .resume()
                  .catch((error: unknown) => Alert.alert('GPS', errorMessage(error)))
              }
              tint={theme.primary}
            />
          )}
          <ControlButton
            icon="stop"
            label="Finalizar"
            onPress={handleFinish}
            tint={theme.danger}
          />
        </View>
        <Pressable accessibilityRole="button" onPress={handleDiscard}>
          <Text style={[styles.discard, { color: theme.muted }]}>Descartar corrida</Text>
        </Pressable>
      </View>
      {saveRun.isPending ? (
        <Text style={[styles.saving, { color: theme.muted }]}>Salvando corrida...</Text>
      ) : null}
    </View>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[big ? styles.statBig : styles.statValue, { color: theme.text }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint: string;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.controlWrap}
    >
      <GlassSurface
        tint={tint}
        radius={radius.pill}
        style={[styles.controlBtn, glassShadow(tint)]}
      >
        <Ionicons name={icon} size={28} color={theme.onPrimary} />
      </GlassSurface>
      <Text style={[styles.controlLabel, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  readyTitle: { fontSize: 24, fontWeight: '800', marginTop: spacing.md },
  readyText: { fontSize: 15, textAlign: 'center' },
  startWrap: { marginTop: spacing.lg, alignSelf: 'stretch' },
  startBtn: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  startText: { fontSize: 17, fontWeight: '800' },
  cancel: { marginTop: spacing.md, fontSize: 15 },
  screen: { flex: 1 },
  stats: { padding: spacing.md, gap: spacing.md, marginTop: -40 },
  statsCard: { padding: spacing.lg, gap: spacing.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 4 },
  statBig: { fontSize: 40, fontWeight: '800' },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 13 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
  controlWrap: { alignItems: 'center', gap: spacing.xs },
  controlBtn: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  controlLabel: { fontSize: 13, fontWeight: '700' },
  discard: { textAlign: 'center', padding: spacing.xs },
  saving: { textAlign: 'center' },
});
