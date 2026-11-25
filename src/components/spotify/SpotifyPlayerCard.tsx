import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { Card } from '@/components/Card';
import { useSpotify } from '@/context/SpotifyContext';
import {
  useNowPlaying,
  usePausePlayback,
  useResumePlayback,
  useSkipNext,
  useSkipPrevious,
} from '@/hooks/useSpotifyPlayer';
import { spacing, useTheme } from '@/theme';
import { errorMessage } from '@/utils/errors';

export function SpotifyPlayerCard() {
  const { theme } = useTheme();
  const { tokens, connect, connecting } = useSpotify();
  const { data: track, isLoading } = useNowPlaying();
  const pause = usePausePlayback();
  const resume = useResumePlayback();
  const next = useSkipNext();
  const previous = useSkipPrevious();
  const run = (mutation: typeof pause) =>
    mutation.mutate(undefined, {
      onError: (error) => Alert.alert('Spotify', errorMessage(error)),
    });

  if (!tokens) {
    return (
      <Card style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="musical-notes" size={22} color={theme.primary} />
          <Text style={[styles.hint, { color: theme.text }]}>
            Conecte o Spotify para ouvir música durante a corrida.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={connect}
          disabled={connecting}
          style={[styles.connectBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.connectText}>
            {connecting ? 'Conectando...' : 'Conectar Spotify'}
          </Text>
        </Pressable>
      </Card>
    );
  }
  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Text style={{ color: theme.muted }}>Carregando Spotify...</Text>
      </Card>
    );
  }
  if (!track) {
    return (
      <Card style={styles.card}>
        <Text style={[styles.hint, { color: theme.text }]}>
          Nenhuma faixa ativa. Abra o Spotify e inicie uma música.
        </Text>
      </Card>
    );
  }
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        {track.albumArt ? (
          <Image source={{ uri: track.albumArt }} style={styles.art} />
        ) : null}
        <View style={styles.trackInfo}>
          <Text style={[styles.trackName, { color: theme.text }]} numberOfLines={1}>
            {track.name}
          </Text>
          <Text style={[styles.hint, { color: theme.muted }]} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>
      </View>
      <View style={styles.controls}>
        <PlayerControl icon="play-skip-back" onPress={() => run(previous)} />
        <PlayerControl
          icon={track.isPlaying ? 'pause' : 'play'}
          onPress={() => run(track.isPlaying ? pause : resume)}
        />
        <PlayerControl icon="play-skip-forward" onPress={() => run(next)} />
      </View>
    </Card>
  );
}

function PlayerControl({
  icon,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.control}>
      <Ionicons name={icon} size={20} color={theme.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hint: { flex: 1, fontSize: 13 },
  connectBtn: { padding: spacing.sm, borderRadius: 12, alignItems: 'center' },
  connectText: { color: 'white', fontWeight: '700' },
  art: { width: 48, height: 48, borderRadius: 8 },
  trackInfo: { flex: 1 },
  trackName: { fontWeight: '700', fontSize: 15 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  control: { padding: spacing.xs },
});
