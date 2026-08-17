import { useState } from "react";
import {
  useAdminAiConfig,
  useSaveAiDraft,
  useUpdateAiKillSwitch,
} from "@/hooks/queries/useAdminAiQueries";
import AiSafetyPanel from "./AiSafetyPanel";
import AiEmptyState from "./AiEmptyState";
import AiKillSwitchDialog from "./AiKillSwitchDialog";
import {
  unwrapResponse,
  conflictRevision,
  mutationErrorMessage,
  ConfigLoading,
  MutationNotice,
} from "./aiAdminConstants";

export default function SafetyWorkspace({ permissions, runtime }) {
  const configQuery = useAdminAiConfig();
  const saveDraftMutation = useSaveAiDraft();
  const killSwitchMutation = useUpdateAiKillSwitch();
  const [killDialogOpen, setKillDialogOpen] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [operationError, setOperationError] = useState(null);
  const [killSwitchError, setKillSwitchError] = useState(null);
  const config = unwrapResponse(configQuery.data);
  const killSwitchEnabled = runtime?.status === "disabled";

  const saveDraft = async (payload) => {
    setConflict(null);
    setOperationError(null);
    try {
      await saveDraftMutation.mutateAsync(payload);
    } catch (error) {
      const newerRevision = conflictRevision(error);
      if (newerRevision !== null) {
        setConflict(newerRevision);
      } else {
        setOperationError(error);
      }
    }
  };

  const updateKillSwitch = async (payload) => {
    setKillSwitchError(null);
    try {
      await killSwitchMutation.mutateAsync(payload);
      setKillDialogOpen(false);
    } catch (error) {
      setKillSwitchError(error);
    }
  };

  const reload = async () => {
    await configQuery.refetch();
    setConflict(null);
    setOperationError(null);
  };

  if (configQuery.isLoading) return <ConfigLoading />;
  if (configQuery.isError || !config) {
    return (
      <AiEmptyState
        isError
        title="Không tải được safety draft"
        description="Keyword rules và kill-switch entry point chưa được mở."
        actionLabel="Tải lại cấu hình"
        onAction={configQuery.refetch}
      />
    );
  }

  return (
    <>
      <MutationNotice
        conflict={conflict}
        error={operationError}
        onReload={reload}
        isReloading={configQuery.isFetching}
      />
      <AiSafetyPanel
        config={config}
        permissions={permissions}
        killSwitchEnabled={killSwitchEnabled}
        onSaveDraft={permissions.manage ? saveDraft : undefined}
        onKillSwitch={
          permissions.killSwitch ? () => setKillDialogOpen(true) : undefined
        }
        isSaving={saveDraftMutation.isPending}
      />
      {permissions.killSwitch && (
        <AiKillSwitchDialog
          open={killDialogOpen}
          onOpenChange={(open) => {
            setKillDialogOpen(open);
            if (!open) setKillSwitchError(null);
          }}
          enabled={!killSwitchEnabled}
          isPending={killSwitchMutation.isPending}
          errorMessage={mutationErrorMessage(killSwitchError)}
          onConfirm={updateKillSwitch}
        />
      )}
    </>
  );
}
