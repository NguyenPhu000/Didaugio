import {
  useAdminAiConfig,
  useTestAiConfig,
} from "@/hooks/queries/useAdminAiQueries";
import AiTestLabPanel from "./AiTestLabPanel";
import AiEmptyState from "./AiEmptyState";
import { unwrapResponse, ConfigLoading } from "./aiAdminConstants";

export default function TestLabWorkspace() {
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
