import { useAdminDraftQuery } from "@/hooks/admin/useAdminDraftQuery";
import { useAdminDraftMutations } from "@/hooks/admin/useAdminDraftMutations";

export const useAdminDraftDocuments = () => {
  const { data: draftDocuments = [], isLoading, error } = useAdminDraftQuery();
  const mutations = useAdminDraftMutations();

  return {
    draftDocuments,
    isLoading,
    error,
    ...mutations
  };
};