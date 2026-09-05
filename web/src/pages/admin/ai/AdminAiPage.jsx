// MAP: AdminAiPage
// ├── UI: @/components/admin/ai/{ConfigurationWorkspace, SafetyWorkspace, TestLabWorkspace, OverviewWorkspace}
// └── API: @/hooks/queries/useAdminAiQueries, @/apis/adminAiService

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LockKeyhole } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERMISSIONS } from "@/constants/permissions";
import { useAdminAiOverview } from "@/hooks/queries/useAdminAiQueries";
import { usePermission } from "@/hooks/usePermission";

// Sub-components
import AiEmptyState from "@/components/admin/ai/AiEmptyState";
import AiLogsPanel from "@/components/admin/ai/AiLogsPanel";
import AiOverviewPanel from "@/components/admin/ai/AiOverviewPanel";
import AiStatusHeader from "@/components/admin/ai/AiStatusHeader";
import ConfigurationWorkspace from "@/components/admin/ai/ConfigurationWorkspace";
import SafetyWorkspace from "@/components/admin/ai/SafetyWorkspace";
import TestLabWorkspace from "@/components/admin/ai/TestLabWorkspace";
import {
  TAB_DEFINITIONS,
  unwrapResponse,
} from "@/components/admin/ai/aiAdminConstants";

function AdminAiCockpit({ hasPermission }) {
  const { t } = useTranslation();
  const overviewQuery = useAdminAiOverview();
  const overview = unwrapResponse(overviewQuery.data);

  const canAccess = (tab) =>
    Boolean(tab?.permissions?.some((permission) => hasPermission(permission)));

  const firstAvailableTab =
    TAB_DEFINITIONS.find(canAccess)?.value || "overview";

  const [activeTab, setActiveTab] = useState(firstAvailableTab);

  const safeActiveTab = canAccess(
    TAB_DEFINITIONS.find((tab) => tab.value === activeTab)
  )
    ? activeTab
    : firstAvailableTab;

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
          <span aria-hidden="true" className="h-8 w-1 shrink-0 bg-primary" />
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Admin / AI Control Center
            </p>
            <h1
              id="admin-ai-title"
              className="text-2xl font-bold uppercase tracking-tight sm:text-3xl"
            >
              {t("adminAi.title", "AI Operations")}
            </h1>
          </div>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t(
            "adminAi.description",
            "Theo dõi trạng thái runtime, chất lượng vận hành và metadata yêu cầu mà không hiển thị nội dung hội thoại."
          )}
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
                className="min-h-11 min-w-max gap-2 rounded-none border-b-2 border-transparent px-4 font-mono text-xs font-semibold uppercase tracking-wide shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:shadow-none cursor-pointer"
              >
                <Icon aria-hidden="true" className="size-4" />
                {t(tab.i18nKey, tab.label)}
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
              <ConfigurationWorkspace permissions={configurationPermissions} />
            )}
        </TabsContent>
        <TabsContent value="safety" className="mt-5">
          {safeActiveTab === "safety" && canAccess(TAB_DEFINITIONS[2]) && (
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
