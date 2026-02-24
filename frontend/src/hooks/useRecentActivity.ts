import { useQuery } from "@tanstack/react-query";
import { api, getStoredAuth } from "@/lib/api";

export function useRecentActivity(limit: number = 10) {
  const auth = getStoredAuth();

  return useQuery({
    queryKey: ["recent-activity", auth?.user?.id ?? null, limit],
    enabled: !!auth?.accessToken,
    queryFn: async () => {
      const data = await api.recentActivity({ limit });
      return data.activity;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

