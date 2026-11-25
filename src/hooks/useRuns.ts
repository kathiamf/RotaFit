import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { deleteRun, getRun, getWeeklyStats, listRuns, saveRun } from '@/services/runs';
import { averagePaceSecPerKm } from '@/utils/geo';
import type { SaveRunInput } from '@/types';

export const useRuns = () => useQuery({ queryKey: ['runs', 'list'], queryFn: listRuns });

export function useRun(id: string | undefined) {
  return useQuery({
    queryKey: ['runs', 'detail', id],
    queryFn: () => {
      if (!id) throw new Error('Identificador da corrida ausente.');
      return getRun(id);
    },
    enabled: Boolean(id),
  });
}

export const useWeeklyStats = () =>
  useQuery({ queryKey: ['runs', 'weekly-stats'], queryFn: getWeeklyStats });

export function useSaveRun() {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveRunInput) => {
      if (!user) throw new Error('Faça login para salvar a corrida.');
      return saveRun(
        input,
        user.id,
        averagePaceSecPerKm(input.distanceMeters, input.durationSeconds),
      );
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['runs'] }),
  });
}

export function useDeleteRun() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRun(id),
    onSuccess: () => client.invalidateQueries({ queryKey: ['runs'] }),
  });
}
