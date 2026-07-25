import { useState } from "react";
import {
  ArchiveRestore,
  KeyRound,
  Save,
  Send,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { toAiConfigForm, toAiDraftPayload } from "../adminAiForm";
import { isValidAiConfigSnapshot } from "../adminAiValidation";

const CONTEXT_SOURCES = [
  ["coarseLocation", "Coarse location"],
  ["travelPreferences", "Travel preferences"],
  ["budget", "Budget"],
  ["partySize", "Party size"],
  ["tripDuration", "Trip duration"],
  ["transportPreference", "Transport preference"],
  ["places", "Places"],
  ["events", "Events"],
  ["sessionMessages", "Session messages"],
  ["time", "Time"],
  ["weather", "Weather"],
  ["openingStatus", "Opening status"],
];

const CONTEXT_FIELDS = [
  ["currentCity", "Current city"],
  ["travelPreferences", "Travel preferences"],
  ["budget", "Budget"],
  ["partySize", "Party size"],
  ["tripDuration", "Trip duration"],
  ["transportPreference", "Transport preference"],
  ["places", "Places"],
  ["events", "Events"],
  ["messages", "Messages"],
  ["timeOfDay", "Time of day"],
  ["weather", "Weather"],
  ["openingStatus", "Opening status"],
];
const isValidProviderSecret = (value) => {
  const secret = value.trim();
  return !secret || (secret.length >= 20 && secret.length <= 500);
};

function SectionHeading({ title, description }) {
  return (
    <div className="mb-5 border-b border-black/15 pb-4 dark:border-white/15">
      <h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function Field({ id, label, description, children }) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="font-mono text-[11px] font-semibold uppercase tracking-wide"
      >
        {label}
      </Label>
      {children}
      {description && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function NumberInput({ id, label, value, onChange, ...inputProps }) {
  return (
    <Field id={id} label={label}>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value === "" ? "" : Number(event.target.value),
          )
        }
        className="rounded-none font-mono tabular-nums"
        {...inputProps}
      />
    </Field>
  );
}

function CheckGrid({ legend, options, selected, onToggle, disabled }) {
  return (
    <fieldset>
      <legend className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wide">
        {legend}
      </legend>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
        {options.map(([value, label]) => (
          <label
            key={value}
            className="flex min-h-8 items-center gap-3 text-sm"
          >
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
              disabled={disabled}
              className="size-4 accent-primary"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AiConfigurationPanelForm({
  config,
  permissions,
  onSaveDraft,
  onPublish,
  onRollback,
  isSaving = false,
}) {
  const mappedForm = toAiConfigForm(config);
  const [configData, setConfigData] = useState(mappedForm.configData);
  const [providerSecret, setProviderSecret] = useState("");
  const [reason, setReason] = useState("");
  const canManage = permissions.manage === true;
  const canRotateSecret = canManage && permissions.secrets === true;
  const formValid =
    isValidAiConfigSnapshot(configData) &&
    (!canRotateSecret || isValidProviderSecret(providerSecret));

  const setSectionValue = (section, field, value) => {
    setConfigData((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const toggleListValue = (field, value) => {
    setConfigData((current) => {
      const selected = current.context[field];
      return {
        ...current,
        context: {
          ...current.context,
          [field]: selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value],
        },
      };
    });
  };

  const submitDraft = (event) => {
    event.preventDefault();
    if (!canManage || !formValid || reason.trim().length < 5) return;
    onSaveDraft(
      toAiDraftPayload(
        {
          configData,
          providerSecret: canRotateSecret ? providerSecret : "",
        },
        mappedForm.revision,
        reason.trim(),
      ),
    );
  };

  if (!configData?.provider) return null;

  return (
    <Card className="rounded-none border-black/20 shadow-none dark:border-white/20">
      <CardHeader className="border-b border-black/20 bg-primary/10 dark:border-white/20">
        <div className="flex items-start gap-3">
          <Settings2 aria-hidden="true" className="mt-0.5 size-5" />
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Draft v{config.draftVersion?.version ?? "—"} · Revision{" "}
              {mappedForm.revision}
            </p>
            <CardTitle className="mt-1 text-lg font-bold uppercase tracking-tight">
              Configuration workbench
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <form onSubmit={submitDraft}>
          <section className="p-5 sm:p-6">
            <SectionHeading
              title="Provider"
              description="Groq là adapter cố định trong Phase 1. Base URL chỉ chấp nhận origin đã phê duyệt."
            />
            <div className="grid gap-5 lg:grid-cols-2">
              <Field id="ai-provider-url" label="Base URL Groq">
                <Input
                  id="ai-provider-url"
                  type="url"
                  value={configData.provider.baseUrl}
                  onChange={(event) =>
                    setSectionValue(
                      "provider",
                      "baseUrl",
                      event.target.value,
                    )
                  }
                  disabled={!canManage}
                  className="rounded-none font-mono"
                />
              </Field>
              <Field id="ai-provider-model" label="Model">
                <Input
                  id="ai-provider-model"
                  value={configData.provider.model}
                  maxLength={160}
                  onChange={(event) =>
                    setSectionValue("provider", "model", event.target.value)
                  }
                  disabled={!canManage}
                  className="rounded-none font-mono"
                />
              </Field>
              {canRotateSecret && (
                <div className="space-y-2 lg:col-span-2">
                  <Field
                    id="ai-provider-secret"
                    label="API key mới"
                    description="Để trống để giữ nguyên khóa. Giá trị đã lưu không bao giờ được đọc ngược về trình duyệt."
                  >
                    <div className="relative">
                      <KeyRound
                        aria-hidden="true"
                        className="absolute left-3 top-3 size-4 text-muted-foreground"
                      />
                      <Input
                        id="ai-provider-secret"
                        type="password"
                        autoComplete="new-password"
                        value={providerSecret}
                        minLength={20}
                        maxLength={500}
                        onChange={(event) =>
                          setProviderSecret(event.target.value)
                        }
                        className="rounded-none pl-10 font-mono"
                      />
                    </div>
                  </Field>
                  {mappedForm.credentialConfigured &&
                    mappedForm.credentialSuffix && (
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {`Đã cấu hình · kết thúc bằng ${mappedForm.credentialSuffix}`}
                      </p>
                    )}
                </div>
              )}
            </div>
          </section>

          <section className="border-t border-black/15 p-5 sm:p-6 dark:border-white/15">
            <SectionHeading
              title="Model parameters"
              description="Giới hạn phía trình duyệt khớp contract runtime phía server."
            />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <NumberInput
                id="ai-temperature"
                label="Temperature"
                value={configData.modelParameters.temperature}
                min="0"
                max="1"
                step="0.1"
                disabled={!canManage}
                onChange={(value) =>
                  setSectionValue("modelParameters", "temperature", value)
                }
              />
              <NumberInput
                id="ai-top-p"
                label="Top P"
                value={configData.modelParameters.topP}
                min="0"
                max="1"
                step="0.1"
                disabled={!canManage}
                onChange={(value) =>
                  setSectionValue("modelParameters", "topP", value)
                }
              />
              <NumberInput
                id="ai-max-tokens"
                label="Max tokens"
                value={configData.modelParameters.maxTokens}
                min="256"
                max="4096"
                step="1"
                disabled={!canManage}
                onChange={(value) =>
                  setSectionValue("modelParameters", "maxTokens", value)
                }
              />
              <NumberInput
                id="ai-timeout"
                label="Timeout (ms)"
                value={configData.modelParameters.timeoutMs}
                min="3000"
                max="30000"
                step="1000"
                disabled={!canManage}
                onChange={(value) =>
                  setSectionValue("modelParameters", "timeoutMs", value)
                }
              />
            </div>
          </section>

          <section className="border-t border-black/15 p-5 sm:p-6 dark:border-white/15">
            <SectionHeading
              title="Prompts"
              description="Ba prompt phục vụ Chat, Planner và Voice; mỗi prompt có tối đa 12.000 ký tự."
            />
            <div className="grid gap-5">
              {[
                ["chat", "Prompt Chat"],
                ["planner", "Prompt Planner"],
                ["voice", "Prompt Voice"],
              ].map(([field, label]) => (
                <Field key={field} id={`ai-prompt-${field}`} label={label}>
                  <Textarea
                    id={`ai-prompt-${field}`}
                    value={configData.prompts[field]}
                    maxLength={12000}
                    rows={4}
                    onChange={(event) =>
                      setSectionValue("prompts", field, event.target.value)
                    }
                    disabled={!canManage}
                    className="min-h-28 rounded-none font-mono text-xs leading-relaxed"
                  />
                </Field>
              ))}
            </div>
          </section>

          <section className="border-t border-black/15 p-5 sm:p-6 dark:border-white/15">
            <SectionHeading
              title="Context policy"
              description="Chỉ nguồn và trường đã đăng ký mới có thể đi vào runtime context."
            />
            <div className="space-y-6">
              <CheckGrid
                legend="Registered context sources"
                options={CONTEXT_SOURCES}
                selected={configData.context.enabledSources}
                onToggle={(value) => toggleListValue("enabledSources", value)}
                disabled={!canManage}
              />
              <CheckGrid
                legend="Field allowlist"
                options={CONTEXT_FIELDS}
                selected={configData.context.fieldAllowlist}
                onToggle={(value) => toggleListValue("fieldAllowlist", value)}
                disabled={!canManage}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <NumberInput
                  id="ai-context-tokens"
                  label="Context token budget"
                  value={configData.context.maxTokens}
                  min="256"
                  max="4000"
                  step="1"
                  disabled={!canManage}
                  onChange={(value) =>
                    setSectionValue("context", "maxTokens", value)
                  }
                />
                <NumberInput
                  id="ai-context-ttl"
                  label="Context TTL (seconds)"
                  value={configData.context.freshnessTtl}
                  min="0"
                  max="86400"
                  step="1"
                  disabled={!canManage}
                  onChange={(value) =>
                    setSectionValue("context", "freshnessTtl", value)
                  }
                />
              </div>
            </div>
          </section>

          <section className="border-t border-black/15 p-5 sm:p-6 dark:border-white/15">
            <SectionHeading
              title="Quota & fallback"
              description="Daily request caps và hành vi bảo trì giữ runtime có đường lui rõ ràng."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberInput
                id="ai-free-quota"
                label="Quota Free"
                value={configData.quotas.freeDailyRequests}
                min="0"
                max="10000"
                step="1"
                disabled={!canManage}
                onChange={(value) =>
                  setSectionValue("quotas", "freeDailyRequests", value)
                }
              />
              <NumberInput
                id="ai-premium-quota"
                label="Quota Premium"
                value={configData.quotas.premiumDailyRequests}
                min="0"
                max="10000"
                step="1"
                disabled={!canManage}
                onChange={(value) =>
                  setSectionValue("quotas", "premiumDailyRequests", value)
                }
              />
              <div className="sm:col-span-2">
                <Field
                  id="ai-maintenance-message"
                  label="Maintenance message"
                >
                  <Textarea
                    id="ai-maintenance-message"
                    value={configData.fallback.maintenanceMessage}
                    maxLength={1000}
                    onChange={(event) =>
                      setSectionValue(
                        "fallback",
                        "maintenanceMessage",
                        event.target.value,
                      )
                    }
                    disabled={!canManage}
                    className="rounded-none"
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between gap-4 border-y border-black/15 py-4 sm:col-span-2 dark:border-white/15">
                <div>
                  <Label
                    htmlFor="ai-static-planner"
                    className="font-mono text-[11px] font-semibold uppercase tracking-wide"
                  >
                    Static planner fallback
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dùng planner tĩnh khi provider không khả dụng.
                  </p>
                </div>
                <input
                  id="ai-static-planner"
                  type="checkbox"
                  role="switch"
                  aria-label="Static planner fallback"
                  checked={configData.fallback.staticPlannerEnabled}
                  onChange={(event) =>
                    setSectionValue(
                      "fallback",
                      "staticPlannerEnabled",
                      event.target.checked,
                    )
                  }
                  disabled={!canManage}
                  className="h-6 w-11 accent-primary"
                />
              </div>
            </div>
          </section>

          <div className="sticky bottom-0 z-10 flex flex-col gap-4 border-t border-black/30 bg-background/95 p-4 sm:flex-row sm:items-end dark:border-white/30">
            {canManage && (
              <div className="min-w-0 flex-1">
                <Field id="ai-change-reason" label="Lý do thay đổi">
                  <Input
                    id="ai-change-reason"
                    value={reason}
                    maxLength={300}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Tối thiểu 5 ký tự"
                    className="rounded-none"
                  />
                </Field>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {permissions.publish && onRollback && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onRollback}
                  className="rounded-none"
                >
                  <ArchiveRestore aria-hidden="true" />
                  Rollback
                </Button>
              )}
              {permissions.publish && onPublish && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPublish}
                  className="rounded-none border-black dark:border-white"
                >
                  <Send aria-hidden="true" />
                  Phát hành
                </Button>
              )}
              {canManage && (
                <Button
                  type="submit"
                  loading={isSaving}
                  disabled={
                    isSaving || !formValid || reason.trim().length < 5
                  }
                  className="rounded-none"
                >
                  <Save aria-hidden="true" />
                  Lưu draft
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AiConfigurationPanel(props) {
  const canRotateSecret =
    props.permissions?.manage === true && props.permissions?.secrets === true;
  return (
    <AiConfigurationPanelForm
      key={`${props.config?.revision ?? "unloaded"}:${canRotateSecret}`}
      {...props}
    />
  );
}
