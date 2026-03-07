import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function useRecentActivity(limit: number = 10) {
  const { user, accessToken } = useAuth();

  return useQuery({
    queryKey: ["recent-activity", user?.id ?? null, limit],
    enabled: !!accessToken,
    queryFn: async () => {
      const data = await api.recentActivity({ limit });
      return data.activity;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
