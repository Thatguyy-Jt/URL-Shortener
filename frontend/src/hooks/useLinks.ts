import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { linksApi } from '../services/linksApi';
import type { CreateLinkInput } from '../types';

export const LINKS_KEY = 'links';

export function useLinks(page = 1, limit = 20) {
  return useQuery({
    queryKey: [LINKS_KEY, page, limit],
    queryFn: () => linksApi.list(page, limit),
  });
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLinkInput) => linksApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LINKS_KEY] }),
  });
}

export function useDeactivateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => linksApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LINKS_KEY] }),
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => linksApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LINKS_KEY] }),
  });
}
