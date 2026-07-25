import { useState } from "react";
import {
  FlaskConical,
  LayoutDashboard,
  LockKeyhole,
  RefreshCcw,
  ScrollText,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { PERMISSIONS } from "@/constants/permissions";
import {
  useAdminAiConfig,
  useAdminAiOverview,
  usePublishAiConfig,
  useRollbackAiConfig,
  useSaveAiDraft,
  useTestAiConfig,
  useUpdateAiKillSwitch,
} from "@/hooks/queries/useAdminAiQueries";
import { usePermission } from "@/hooks/usePermission";
import AiConfigurationPanel from "./components/AiConfigurationPanel";
import AiEmptyState from "./components/AiEmptyState";
import AiKillSwitchDialog from "./components/AiKillSwitchDialog";
import AiLogsPanel from "./components/AiLogsPanel";
import AiOverviewPanel from "./components/AiOverviewPanel";
import AiPublishDialog from "./components/AiPublishDialog";
import AiRollbackDialog from "./components/AiRollbackDialog";
import AiSafetyPanel from "./components/AiSafetyPanel";
import AiStatusHeader from "./components/AiStatusHeader";
import AiTestLabPanel from "./components/AiTestLabPanel";

const TAB_DEFINITIONS = [
  {
    value: "overview",
    label: "Tổng quan",
    icon: LayoutDashboard,
    permissions: [PERMISSIONS.AI.VIEW],
  },
  {
    value: "configuration",
    label: "Cấu hình",
    icon: Settings2,
    permissions: [
      PERMISSIONS.AI.CONFIG_MANAGE,
      PERMISSIONS.AI.CONFIG_PUBLISH,
      PERMISSIONS.AI.SECRETS_MANAGE,
    ],
  },
  {
    value: "safety",
    label: "An toàn",
    icon: ShieldCheck,
    permissions: [
      PERMISSIONS.AI.CONFIG_MANAGE,
      PERMISSIONS.AI.KILL_SWITCH_MANAGE,
    ],
  },
  {
    value: "logs",
    label: "Logs & Feedback",
    icon: ScrollText,
    permissions: [PERMISSIONS.AI.LOGS_VIEW],
  },
  {
    value: "test-lab",
    label: "Test Lab",
    icon: FlaskConical,
    permissions: [PERMISSIONS.AI.TEST_RUN],
  },
];

function unwrapResponse(value) {
  return value?.success === true && value?.data !== undefined
    ? value.data
    : value;
}

function conflictRevision(error) {
  const status = error?.status ?? error?.response?.status;
  const data = error?.data ?? error?.response?.data ?? {};
  if (
    (status === 409 || data.errorCode === "AI_CONFIG_CONFLICT") &&
    Number.isSafeInteger(data.currentRevision) &&
    data.currentRevision >= 0
  ) {
    return data.currentRevision;
  }
  return null;
}

function mutationErrorMessage(error) {
  const data = error?.data ?? error?.response?.data ?? {};
  return data.message ?? error?.message ?? "Không thể hoàn tất thao tác AI.";
}

function ConfigLoading() {
  return (
    <div
      role="status"
      aria-label="Đang tải cấu hình AI"
      className="flex min-h-64 items-center justify-center border border-black/20 font-mono text-xs uppercase tracking-wide dark:border-white/20"
    >
      Đang tải cấu hình AI…
    </div>
  );
}

function MutationNotice({
  conflict,
  error,
  onReload,
  isReloading = false,
}) {
  if (conflict !== null) {
    return (
      <div
        role="alert"
        className="mb-4 flex flex-col gap-3 border-l-4 border-primary bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wide">
            Có revision mới hơn: {conflict}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Mutation đã dừng và không tự retry. Reload dữ liệu trước khi tiếp
            tục.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          loading={isReloading}
          onClick={onReload}
          className="rounded-none border-black dark:border-white"
        >
          <RefreshCcw aria-hidden="true" />
          Reload revision
        </Button>
      </div>
    );
  }

  if (!error) return null;
  return (
    <p
      role="alert"
      className="mb-4 border-l-4 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {error.message ?? "Không thể hoàn tất thao tác AI."}
    </p>
  );
}

function ConfigurationWorkspace({ permissions }) {
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
    { closeDialog, setDialogError } = {},
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
      } else {
        if (setDialogError) setDialogError(error);
        else setOperationError(error);
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
            ? (payload) => runMutation(saveDraftMutation, payload)
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

function SafetyWorkspace({ permissions, runtime }) {
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
      if (newerRevision !== null) setConflict(newerRevision);
      else setOperationError(error);
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
          permissions.killSwitch
            ? () => setKillDialogOpen(true)
            : undefined
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

function TestLabWorkspace() {
  const configQuery = useAdminAiConfig();
  const testMutation = useTestAiConfig();
  const config = unwrapResponse(configQuery.data);
  const runTest = async (payload) => {
    try {
      await testMutation.mutateAsync(payload);
    } catch {
      // React Query owns the rendered validation/provider error state.
    }
  };

  if (configQuery.isLoading) return <ConfigLoading />;
  if (configQuery.isError || !config) {
    return (
      <AiEmptyState
        isError
        title="Không tải được cấu hình Test Lab"
        description="Chưa có phiên bản cấu hình tin cậy, nên Test Lab không gửi request."
        actionLabel="Tải lại cấu hình"
        onAction={configQuery.refetch}
      />
    );
  }

  return (
    <AiTestLabPanel
      onRun={runTest}
      result={unwrapResponse(testMutation.data)}
      error={testMutation.error}
      isRunning={testMutation.isPending}
      sourceVersions={{
        draft: config?.draftVersion?.version,
        published: config?.activeVersion?.version,
      }}
    />
  );
}

function AdminAiCockpit({ hasPermission }) {
  const [activeTab, setActiveTab] = useState("overview");
  const overviewQuery = useAdminAiOverview();
  const canAccess = (tab) =>
    tab.permissions.some((permission) => hasPermission(permission));
  const activeDefinition = TAB_DEFINITIONS.find(
    (tab) => tab.value === activeTab,
  );
  const safeActiveTab =
    activeDefinition && canAccess(activeDefinition) ? activeTab : "overview";
  const overview = unwrapResponse(overviewQuery.data);
  const configurationPermissions = {
    manage: hasPermission(PERMISSIONS.AI.CONFIG_MANAGE),
    publish: hasPermission(PERMISSIONS.AI.CONFIG_PUBLISH),
    secrets: hasPermission(PERMISSIONS.AI.SECRETS_MANAGE),
  };
  const safetyPermissions = {
    manage: hasPermission(PERMISSIONS.AI.CONFIG_MANAGE),
    killSwitch: hasPermission(PERMISSIONS.AI.KILL_SWITCH_MANAGE),
  };

  return (
    <section
      className="mx-auto min-w-0 max-w-[1600px] space-y-5 font-sans"
      aria-labelledby="admin-ai-title"
    >
      <header className="flex flex-col gap-3 border-b border-black/20 pb-4 dark:border-white/20">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-8 w-1 shrink-0 bg-primary"
          />
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Admin / AI Control Center
            </p>
            <h1
              id="admin-ai-title"
              className="text-2xl font-bold uppercase tracking-tight sm:text-3xl"
            >
              AI Operations
            </h1>
          </div>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Theo dõi trạng thái runtime, chất lượng vận hành và metadata yêu cầu
          mà không hiển thị nội dung hội thoại.
        </p>
      </header>

      <AiStatusHeader
        data={overview?.runtime}
        isLoading={overviewQuery.isLoading}
        isError={overviewQuery.isError}
      />

      <Tabs
        value={safeActiveTab}
        onValueChange={(value) => {
          const nextTab = TAB_DEFINITIONS.find((tab) => tab.value === value);
          if (nextTab && canAccess(nextTab)) setActiveTab(value);
        }}
        className="min-w-0"
      >
        <TabsList
          aria-label="Khu vực quản trị AI"
          className="flex h-auto w-full justify-start overflow-x-auto rounded-none border-y border-black/20 bg-transparent p-0 dark:border-white/20"
        >
          {TAB_DEFINITIONS.map((tab) => {
            const Icon = tab.icon;
            const allowed = canAccess(tab);
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={!allowed}
                title={allowed ? undefined : "Bạn không có quyền mở khu vực này"}
                className="min-h-11 min-w-max gap-2 rounded-none border-b-2 border-transparent px-4 font-mono text-xs font-semibold uppercase tracking-wide shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-none"
              >
                <Icon aria-hidden="true" className="size-4" />
                {tab.label}
                {!allowed && (
                  <LockKeyhole aria-hidden="true" className="ml-1 size-3" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <AiOverviewPanel
            data={overview}
            isLoading={overviewQuery.isLoading}
            isError={overviewQuery.isError}
            onRetry={overviewQuery.refetch}
          />
        </TabsContent>
        <TabsContent value="configuration" className="mt-5">
          {safeActiveTab === "configuration" &&
            canAccess(TAB_DEFINITIONS[1]) && (
              <ConfigurationWorkspace
                permissions={configurationPermissions}
              />
            )}
        </TabsContent>
        <TabsContent value="safety" className="mt-5">
          {safeActiveTab === "safety" &&
            canAccess(TAB_DEFINITIONS[2]) && (
              <SafetyWorkspace
                permissions={safetyPermissions}
                runtime={overview?.runtime}
              />
            )}
        </TabsContent>
        <TabsContent value="logs" className="mt-5">
          {safeActiveTab === "logs" &&
            hasPermission(PERMISSIONS.AI.LOGS_VIEW) && <AiLogsPanel />}
        </TabsContent>
        <TabsContent value="test-lab" className="mt-5">
          {safeActiveTab === "test-lab" &&
            hasPermission(PERMISSIONS.AI.TEST_RUN) && <TestLabWorkspace />}
        </TabsContent>
      </Tabs>
    </section>
  );
}

export default function AdminAiPage() {
  const { hasPermission } = usePermission();

  if (!hasPermission(PERMISSIONS.AI.VIEW)) {
    return (
      <section
        className="mx-auto max-w-3xl font-sans"
        aria-label="AI Control Center"
      >
        <AiEmptyState
          icon={LockKeyhole}
          eyebrow="Access restricted"
          title="Bạn không có quyền truy cập AI Control Center"
          description="Tài khoản cần quyền ai.view để xem trạng thái hoặc gọi API vận hành AI."
        />
      </section>
    );
  }

  return <AdminAiCockpit hasPermission={hasPermission} />;
}
