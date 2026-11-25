# RotaFit

Aplicativo de corrida com GPS para registrar percurso, distância, duração e ritmo, com temas claro e escuro e integração opcional com o Spotify.

## Funcionalidades

- Login com Google por meio do Supabase Auth.
- Acompanhamento de corrida por GPS, com pausa, retomada, finalização e descarte.
- Traçado do percurso em SVG, sem serviço de mapas ou chave paga.
- Histórico, detalhes e estatísticas semanais protegidos por RLS.
- Spotify OAuth com PKCE, reprodução atual e controles de faixa.
- Temas persistidos: Milano Red + Lemon Chiffon no claro e paleta rubro-negra no escuro.
- Interface Liquid Glass com desfoque, gradientes e superfícies translúcidas.

## Tecnologias

React Native, Expo SDK 58, Expo Router, TypeScript, Supabase Auth/Postgres/RLS, TanStack Query, `expo-location`, Spotify Web API, `expo-auth-session`, `react-native-svg`, Jest e PGlite.

## Configuração

1. Instale Node.js e as dependências do projeto:

   ```sh
   npm install
   ```

2. Crie um projeto Supabase e execute [`supabase/schema.sql`](./supabase/schema.sql) no SQL Editor.
3. Configure Google como provedor em **Authentication → Providers**. Use o callback `https://SEU-PROJETO.supabase.co/auth/v1/callback` no Google Cloud e adicione `rotafit://` às Redirect URLs do Supabase.
4. Crie um app no [Spotify for Developers](https://developer.spotify.com/dashboard) e configure `rotafit://spotify-auth` como redirect URI.
5. Copie `.env.example` para `.env` e preencha URL/chave pública do Supabase e Spotify Client ID. Não coloque client secrets no app e não versione `.env`.
6. Inicie o Expo e abra o projeto em um dispositivo iOS ou Android:

   ```sh
   npx expo start
   ```

O GPS precisa de um dispositivo físico e permissão de localização em primeiro plano. O controle de reprodução do Spotify depende de conta Premium e de um dispositivo Spotify ativo.

## Testes e qualidade

```sh
npm run typecheck
npm test
npm run format
```

`npm test` executa 37 testes Jest do app e 11 testes de banco no PGlite, usando o mesmo esquema SQL sem Docker.

## Estrutura

```text
app/          rotas Expo Router, autenticação, abas e telas de corrida
src/
  components/ interface, Liquid Glass, SVG e player Spotify
  context/    autenticação, tema e tokens Spotify
  hooks/      consultas, player e rastreador GPS
  lib/        clientes Supabase, OAuth e armazenamento seguro
  services/   acesso a corridas e Spotify
  theme/      paletas, tokens e preferência de tema
  types/      tipos do domínio
  utils/      geolocalização, reducer, formatação e erros
supabase/     esquema SQL e testes PGlite
__tests__/    testes do domínio do app
```

## Sem mapas pagos

A rota é normalizada e desenhada com SVG local. O login Google é intermediado pelo Supabase; o Spotify usa PKCE, sem client secret no aplicativo.

## Autoria

**Kathi** · [GitHub](https://github.com/kathiamf)
