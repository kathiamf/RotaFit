import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export const authRedirectUri = AuthSession.makeRedirectUri({ scheme: 'rotafit' });

export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: authRedirectUri, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Não foi possível iniciar o login com o Google.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUri);
  if (result.type !== 'success' || !result.url) {
    if (result.type === 'cancel' || result.type === 'dismiss') return;
    throw new Error('O login com o Google não foi concluído.');
  }
  const callback = new URL(result.url);
  const hashParams = new URLSearchParams(callback.hash.replace(/^#/, ''));
  const params = new URLSearchParams(callback.search);
  hashParams.forEach((value, name) => params.set(name, value));
  const errorCode = params.get('error');
  if (errorCode) throw new Error(params.get('error_description') ?? errorCode);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    throw new Error('O Google não devolveu uma sessão válida.');
  }
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) throw sessionError;
}
