import * as AuthSession from 'expo-auth-session';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secureStore';
import { SPOTIFY_SCOPES, spotifyClientId, spotifyDiscovery } from '@/lib/spotify';
import type { SpotifyTokens } from '@/types';

const STORE_KEY = 'rotafit.spotify.tokens';
interface SpotifyContextValue {
  tokens: SpotifyTokens | null;
  connecting: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  getValidAccessToken: () => Promise<string | null>;
}
const SpotifyContext = createContext<SpotifyContextValue | undefined>(undefined);
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'rotafit',
  path: 'spotify-auth',
});

async function saveTokens(tokens: SpotifyTokens) {
  await setSecureItem(STORE_KEY, JSON.stringify(tokens));
}

async function loadTokens(): Promise<SpotifyTokens | null> {
  const raw = await getSecureItem(STORE_KEY);
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('accessToken' in parsed) ||
    !('refreshToken' in parsed) ||
    !('expiresAt' in parsed) ||
    typeof parsed.accessToken !== 'string' ||
    typeof parsed.refreshToken !== 'string' ||
    typeof parsed.expiresAt !== 'number'
  ) {
    throw new Error(
      'Tokens salvos do Spotify estão inválidos. Desconecte e conecte novamente.',
    );
  }
  return parsed as SpotifyTokens;
}

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<SpotifyTokens | null>(null);
  const [connecting, setConnecting] = useState(false);
  const refreshing = useRef<Promise<string | null> | null>(null);
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    { clientId: spotifyClientId, scopes: SPOTIFY_SCOPES, redirectUri, usePKCE: true },
    spotifyDiscovery,
  );

  useEffect(() => {
    let active = true;
    loadTokens()
      .then((saved) => {
        if (active) setTokens(saved);
      })
      .catch((error: unknown) =>
        console.error('Falha ao carregar tokens do Spotify:', error),
      );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (response?.type !== 'success' || !request?.codeVerifier) {
      if (response?.type === 'error' || response?.type === 'cancel') setConnecting(false);
      return;
    }
    let active = true;
    setConnecting(true);
    AuthSession.exchangeCodeAsync(
      {
        clientId: spotifyClientId,
        code: response.params.code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier },
      },
      spotifyDiscovery,
    )
      .then(async (result) => {
        const next: SpotifyTokens = {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken ?? '',
          expiresAt: Date.now() + (result.expiresIn ?? 3600) * 1000,
        };
        await saveTokens(next);
        if (active) setTokens(next);
      })
      .catch((error: unknown) => console.error('Falha na autenticação Spotify:', error))
      .finally(() => {
        if (active) setConnecting(false);
      });
    return () => {
      active = false;
    };
  }, [response, request]);

  const connect = useCallback(() => {
    setConnecting(true);
    promptAsync().catch((error: unknown) => {
      console.error('Falha ao abrir autenticação Spotify:', error);
      setConnecting(false);
    });
  }, [promptAsync]);

  const disconnect = useCallback(async () => {
    await deleteSecureItem(STORE_KEY);
    setTokens(null);
  }, []);

  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) return null;
    if (tokens.expiresAt - Date.now() > 60_000) return tokens.accessToken;
    if (!tokens.refreshToken) {
      await disconnect();
      return null;
    }
    if (!refreshing.current) {
      refreshing.current = AuthSession.refreshAsync(
        { clientId: spotifyClientId, refreshToken: tokens.refreshToken },
        spotifyDiscovery,
      )
        .then(async (result) => {
          const next: SpotifyTokens = {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken ?? tokens.refreshToken,
            expiresAt: Date.now() + (result.expiresIn ?? 3600) * 1000,
          };
          await saveTokens(next);
          setTokens(next);
          return next.accessToken;
        })
        .catch(async (error: unknown) => {
          console.error(
            'Falha ao renovar token Spotify; será necessário reconectar:',
            error,
          );
          await disconnect();
          return null;
        })
        .finally(() => {
          refreshing.current = null;
        });
    }
    return refreshing.current;
  }, [tokens, disconnect]);

  const value = useMemo(
    () => ({ tokens, connecting, connect, disconnect, getValidAccessToken }),
    [tokens, connecting, connect, disconnect, getValidAccessToken],
  );
  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
}

export function useSpotify(): SpotifyContextValue {
  const context = useContext(SpotifyContext);
  if (!context) throw new Error('useSpotify deve ser usado dentro de <SpotifyProvider>');
  return context;
}
