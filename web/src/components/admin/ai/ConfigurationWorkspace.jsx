import { useState } from "react";
import {
  useAdminAiConfig,
  useSaveAiDraft,
  usePublishAiConfig,
  useRollbackAiConfig,
} from "@/hooks/queries/useAdminAiQueries";
import AiConfigurationPanel from "./AiConfigurationPanel";
import AiEmptyState from "./AiEmptyState";
import AiPublishDialog from "./AiPublishDialog";
import AiRollbackDialog from "./AiRollbackDialog";
import {
  unwrapResponse,
  conflictRevision,
  mutationErrorMessage,
  ConfigLoading,
  MutationNotice,
} from "./aiAdminConstants";

export default function ConfigurationWorkspace({ permissions }) {
  const configQuery = useAdminAiConfig();
  const saveDraftMutation = useSaveAiDraft();
  const publishMutation = usePublishAiConfig();
  const rollbackMutation = useRollbackAiConfig();
  const [publishOpen, setPublishOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [operationError, setOperationError] = useState(null);
  const [publishError, setPublishError] = useState(null);
  const [rollbackError, setRollbackError] = useState(null);
  const config = unwrapResponse(configQuery.data);

  const runMutation = async (
    mutation,
    payload,
    { closeDialog, setDialogError } = {}
  ) => {
    setConflict(null);
    setOperationError(null);
    setDialogError?.(null);
    try {
      await mutation.mutateAsync(payload);
      closeDialog?.();
    } catch (error) {
      const newerRevision = conflictRevision(error);
      if (newerRevision !== null) {
        setConflict(newerRevision);
        closeDialog?.();
      } else if (setDialogError) {
        setDialogError(error);
      } else {
        setOperationError(error);
      }
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
        title="Không tải được cấu hình AI"
        description="Không có mutation nào được mở khi snapshot cấu hình chưa sẵn sàng."
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
      <AiConfigurationPanel
        config={config}
        permissions={permissions}
        onSaveDraft={
          permissions.manage
            ? async (payload) => {
                setConflict(null);
                setOperationError(null);
                try {
                  const savedResponse =
                    await saveDraftMutation.mutateAsync(payload);
                  const savedData = unwrapResponse(savedResponse);
                  if (permissions.publish) {
                    await publishMutation.mutateAsync({
                      revision: savedData?.revision ?? config.revision,
                      changeReason:
                        payload.changeReason ||
                        "Cập nhật và phát hành cấu hình AI",
                    });
                  }
                } catch (error) {
                  const newerRevision = conflictRevision(error);
                  if (newerRevision !== null) {
                    setConflict(newerRevision);
                  } else {
                    setOperationError(error);
                  }
                }
              }
            : undefined
        }
        onPublish={
          permissions.publish
            ? () => {
                setPublishError(null);
                setPublishOpen(true);
              }
            : undefined
        }
        onRollback={
          permissions.publish
            ? () => {
                setRollbackError(null);
                setRollbackOpen(true);
              }
            : undefined
        }
        isSaving={saveDraftMutation.isPending}
      />
      {permissions.publish && (
        <>
          <AiPublishDialog
            open={publishOpen}
            onOpenChange={(open) => {
              setPublishOpen(open);
              if (!open) setPublishError(null);
            }}
            revision={config.revision}
            currentVersion={config.activeVersion?.version}
            draftVersion={config.draftVersion?.version}
            isPending={publishMutation.isPending}
            errorMessage={mutationErrorMessage(publishError)}
            onConfirm={(payload) =>
              runMutation(publishMutation, payload, {
                closeDialog: () => setPublishOpen(false),
                setDialogError: setPublishError,
              })
            }
          />
          <AiRollbackDialog
            open={rollbackOpen}
            onOpenChange={(open) => {
              setRollbackOpen(open);
              if (!open) setRollbackError(null);
            }}
            currentVersion={config.activeVersion?.version}
            versions={config.versions}
            isPending={rollbackMutation.isPending}
            errorMessage={mutationErrorMessage(rollbackError)}
            onConfirm={(payload) =>
              runMutation(rollbackMutation, payload, {
                closeDialog: () => setRollbackOpen(false),
                setDialogError: setRollbackError,
              })
            }
          />
        </>
      )}
    </>
  );
}
