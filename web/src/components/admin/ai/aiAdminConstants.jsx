import React from "react";
import {
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  ScrollText,
  FlaskConical,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERMISSIONS } from "@/constants/permissions";

export const TAB_DEFINITIONS = [
  {
    value: "overview",
    i18nKey: "adminAi.tabs.overview",
    label: "Tổng quan",
    icon: LayoutDashboard,
    permissions: [PERMISSIONS.AI.VIEW],
  },
  {
    value: "configuration",
    i18nKey: "adminAi.tabs.configuration",
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
    i18nKey: "adminAi.tabs.safety",
    label: "An toàn",
    icon: ShieldCheck,
    permissions: [
      PERMISSIONS.AI.CONFIG_MANAGE,
      PERMISSIONS.AI.KILL_SWITCH_MANAGE,
    ],
  },
  {
    value: "logs",
    i18nKey: "adminAi.tabs.logs",
    label: "Logs & Feedback",
    icon: ScrollText,
    permissions: [PERMISSIONS.AI.LOGS_VIEW],
  },
  {
    value: "test-lab",
    i18nKey: "adminAi.tabs.testLab",
    label: "Test Lab",
    icon: FlaskConical,
    permissions: [PERMISSIONS.AI.TEST_RUN],
  },
];

export function unwrapResponse(value) {
  return value?.success === true && value?.data !== undefined
    ? value.data
    : value;
}

export function conflictRevision(error) {
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

export function mutationErrorMessage(error) {
  const data = error?.data ?? error?.response?.data ?? {};
  return data.message ?? error?.message ?? "Không thể hoàn tất thao tác AI.";
}

export function ConfigLoading() {
  return (
    <output
      aria-label="Đang tải cấu hình AI"
      className="flex min-h-64 items-center justify-center border border-black/20 font-mono text-xs uppercase tracking-wide dark:border-white/20"
    >
      Đang tải cấu hình AI…
    </output>
  );
}

export function MutationNotice({
  conflict,
  error,
  onReload,
  isReloading = false,
}) {
  if (conflict !== null) {
    return (
      <div
        role="alert"
        className="mb-4 flex flex-col gap-3 border border-primary/30 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between rounded-sm"
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
          className="rounded-none border-black dark:border-white cursor-pointer"
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
      className="mb-4 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive rounded-sm"
    >
      {error.message ?? "Không thể hoàn tất thao tác AI."}
    </p>
  );
}
