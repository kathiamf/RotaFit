import * as Location from 'expo-location';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { averagePaceSecPerKm, simplifyRoute } from '@/utils/geo';
import { elapsedSeconds, initialTrackerState, trackerReducer } from '@/utils/tracker';
import type { SaveRunInput } from '@/types';

export function useRunTracker() {
  const [state, dispatch] = useReducer(trackerReducer, initialTrackerState);
  const [now, setNow] = useState(() => Date.now());
  const [permissionDenied, setPermissionDenied] = useState(false);
  const subscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (state.status !== 'active') return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state.status]);

  const stopWatching = useCallback(() => {
    subscription.current?.remove();
    subscription.current = null;
  }, []);
  useEffect(() => stopWatching, [stopWatching]);

  const startWatching = useCallback(async () => {
    const nextSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (location) =>
        dispatch({
          type: 'ADD_POINT',
          now: location.timestamp,
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        }),
    );
    subscription.current = nextSubscription;
  }, []);

  const start = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      return false;
    }
    setPermissionDenied(false);
    const startedAt = Date.now();
    dispatch({ type: 'START', now: startedAt });
    try {
      await startWatching();
    } catch (error) {
      dispatch({ type: 'RESET' });
      throw error;
    }
    return true;
  }, [startWatching]);

  const pause = useCallback(() => {
    stopWatching();
    dispatch({ type: 'PAUSE', now: Date.now() });
  }, [stopWatching]);

  const resume = useCallback(async () => {
    dispatch({ type: 'RESUME', now: Date.now() });
    try {
      await startWatching();
    } catch (error) {
      dispatch({ type: 'PAUSE', now: Date.now() });
      throw error;
    }
  }, [startWatching]);

  const finish = useCallback(
    (spotifyTrackName: string | null): SaveRunInput | null => {
      stopWatching();
      const finishedAt = Date.now();
      dispatch({ type: 'FINISH', now: finishedAt });
      if (state.startedAt === null) return null;
      const finalPausedMs =
        state.pausedMs +
        (state.status === 'paused' && state.pauseStartedAt !== null
          ? finishedAt - state.pauseStartedAt
          : 0);
      return {
        startedAt: new Date(state.startedAt).toISOString(),
        endedAt: new Date(finishedAt).toISOString(),
        distanceMeters: state.distanceMeters,
        durationSeconds: Math.round(
          elapsedSeconds(
            {
              ...state,
              status: 'finished',
              finishedAt,
              pausedMs: finalPausedMs,
              pauseStartedAt: null,
            },
            finishedAt,
          ),
        ),
        route: simplifyRoute(state.route),
        spotifyTrackName,
      };
    },
    [state, stopWatching],
  );

  const reset = useCallback(() => {
    stopWatching();
    dispatch({ type: 'RESET' });
  }, [stopWatching]);
  const seconds = elapsedSeconds(state, now);

  return {
    status: state.status,
    route: state.route,
    distanceMeters: state.distanceMeters,
    elapsedSeconds: seconds,
    pace: averagePaceSecPerKm(state.distanceMeters, seconds),
    permissionDenied,
    start,
    pause,
    resume,
    finish,
    reset,
  };
}
