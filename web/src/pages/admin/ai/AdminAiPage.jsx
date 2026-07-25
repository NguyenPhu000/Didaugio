import { useState } from "react";
import {
  ClipboardCheck,
  FlaskConical,
  LayoutDashboard,
  LockKeyhole,
  ScrollText,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { PERMISSIONS } from "@/constants/permissions";
import {
  useAdminAiOverview,
} from "@/hooks/queries/useAdminAiQueries";
import { usePermission } from "@/hooks/usePermission";
import AiEmptyState from "./components/AiEmptyState";
import AiLogsPanel from "./components/AiLogsPanel";
import AiOverviewPanel from "./components/AiOverviewPanel";
import AiStatusHeader from "./components/AiStatusHeader";

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

function PlannedPanel({ title, description }) {
  return (
    <AiEmptyState
      icon={ClipboardCheck}
      eyebrow="Task 9"
      title={title}
      description={description}
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
          <PlannedPanel
            title="Cấu hình sẽ được mở ở Task 9"
            description="Draft, publish và rollback được giữ ngoài phạm vi của cockpit vận hành này."
          />
        </TabsContent>
        <TabsContent value="safety" className="mt-5">
          <PlannedPanel
            title="Bảng điều khiển an toàn sẽ được mở ở Task 9"
            description="Quy tắc safety và kill switch sẽ có luồng xác nhận riêng."
          />
        </TabsContent>
        <TabsContent value="logs" className="mt-5">
          {safeActiveTab === "logs" &&
            hasPermission(PERMISSIONS.AI.LOGS_VIEW) && <AiLogsPanel />}
        </TabsContent>
        <TabsContent value="test-lab" className="mt-5">
          <PlannedPanel
            title="Test Lab sẽ được mở ở Task 9"
            description="Các request thử nghiệm sẽ được đánh dấu riêng và không đi vào production metrics."
          />
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
