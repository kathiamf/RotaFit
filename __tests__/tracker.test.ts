import { elapsedSeconds, initialTrackerState, trackerReducer } from '@/utils/tracker';

describe('trackerReducer', () => {
  it('inicia com dados limpos', () => {
    const started = trackerReducer(initialTrackerState, { type: 'START', now: 1000 });
    expect(started.status).toBe('active');
    expect(started.startedAt).toBe(1000);
    expect(started.route).toEqual([]);
  });
  it('adiciona o primeiro ponto sem distância acumulada', () => {
    let state = trackerReducer(initialTrackerState, { type: 'START', now: 0 });
    state = trackerReducer(state, { type: 'ADD_POINT', now: 1000, lat: 0, lng: 0 });
    expect(state.route).toHaveLength(1);
    expect(state.distanceMeters).toBe(0);
  });
  it('adiciona ponto plausível e atualiza distância', () => {
    let state = trackerReducer(initialTrackerState, { type: 'START', now: 0 });
    state = trackerReducer(state, { type: 'ADD_POINT', now: 0, lat: 0, lng: 0 });
    state = trackerReducer(state, { type: 'ADD_POINT', now: 2000, lat: 0, lng: 0.0001 });
    expect(state.route).toHaveLength(2);
    expect(state.distanceMeters).toBeGreaterThan(0);
  });
  it('ignora ponto que chega fora do estado ativo', () => {
    const state = trackerReducer(initialTrackerState, {
      type: 'ADD_POINT',
      now: 10,
      lat: 0,
      lng: 0,
    });
    expect(state).toBe(initialTrackerState);
  });
  it('ignora salto implausível sem atualizar rota', () => {
    let state = trackerReducer(initialTrackerState, { type: 'START', now: 0 });
    state = trackerReducer(state, { type: 'ADD_POINT', now: 0, lat: 0, lng: 0 });
    const previous = state;
    state = trackerReducer(state, { type: 'ADD_POINT', now: 1000, lat: 0, lng: 1 });
    expect(state).toBe(previous);
  });
  it('pausa apenas corrida ativa', () => {
    const active = trackerReducer(initialTrackerState, { type: 'START', now: 0 });
    expect(trackerReducer(active, { type: 'PAUSE', now: 1000 }).status).toBe('paused');
    expect(trackerReducer(initialTrackerState, { type: 'PAUSE', now: 1000 })).toBe(
      initialTrackerState,
    );
  });
  it('retoma e acumula tempo pausado', () => {
    let state = trackerReducer(initialTrackerState, { type: 'START', now: 0 });
    state = trackerReducer(state, { type: 'PAUSE', now: 1000 });
    state = trackerReducer(state, { type: 'RESUME', now: 6000 });
    expect(state.status).toBe('active');
    expect(state.pausedMs).toBe(5000);
    expect(state.pauseStartedAt).toBeNull();
  });
  it('não retoma corrida que não está pausada', () => {
    const active = trackerReducer(initialTrackerState, { type: 'START', now: 0 });
    expect(trackerReducer(active, { type: 'RESUME', now: 1000 })).toBe(active);
  });
  it('finaliza corrida ativa e define horário final', () => {
    const active = trackerReducer(initialTrackerState, { type: 'START', now: 0 });
    const done = trackerReducer(active, { type: 'FINISH', now: 10_000 });
    expect(done.status).toBe('finished');
    expect(done.finishedAt).toBe(10_000);
  });
  it('finaliza enquanto pausada e contabiliza a pausa final', () => {
    let state = trackerReducer(initialTrackerState, { type: 'START', now: 0 });
    state = trackerReducer(state, { type: 'PAUSE', now: 1000 });
    state = trackerReducer(state, { type: 'FINISH', now: 4000 });
    expect(state.pausedMs).toBe(3000);
    expect(state.status).toBe('finished');
  });
  it('não finaliza estado ocioso', () => {
    expect(trackerReducer(initialTrackerState, { type: 'FINISH', now: 100 })).toBe(
      initialTrackerState,
    );
  });
  it('reinicia qualquer corrida para o estado inicial', () => {
    const active = trackerReducer(initialTrackerState, { type: 'START', now: 0 });
    expect(trackerReducer(active, { type: 'RESET' })).toEqual(initialTrackerState);
  });
});

describe('elapsedSeconds', () => {
  it('é zero antes de começar', () => {
    expect(elapsedSeconds(initialTrackerState, 5000)).toBe(0);
  });
  it('conta tempo em corrida ativa', () => {
    const state = trackerReducer(initialTrackerState, { type: 'START', now: 1000 });
    expect(elapsedSeconds(state, 11_000)).toBe(10);
  });
  it('desconta pausas completas e a pausa em andamento', () => {
    let state = trackerReducer(initialTrackerState, { type: 'START', now: 0 });
    state = trackerReducer(state, { type: 'PAUSE', now: 2000 });
    expect(elapsedSeconds(state, 7000)).toBe(2);
    state = trackerReducer(state, { type: 'RESUME', now: 7000 });
    expect(elapsedSeconds(state, 12_000)).toBe(7);
  });
  it('tempo final não continua crescendo', () => {
    let state = trackerReducer(initialTrackerState, { type: 'START', now: 0 });
    state = trackerReducer(state, { type: 'FINISH', now: 3000 });
    expect(elapsedSeconds(state, 90_000)).toBe(3);
  });
});
