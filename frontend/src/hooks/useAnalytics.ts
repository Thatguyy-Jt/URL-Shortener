import { useQuery } from '@tanstack/react-query';
import { linksApi } from '../services/linksApi';

export function useAnalytics(linkId: string) {
  return useQuery({
    queryKey: ['analytics', linkId],
    queryFn: () => linksApi.analytics(linkId),
    enabled: !!linkId,
    staleTime: 60_000, // 1 min — analytics don't need to refresh every second
  });
}
