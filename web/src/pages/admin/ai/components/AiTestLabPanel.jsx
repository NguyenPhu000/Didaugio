import { useState } from "react";
import {
  Braces,
  FlaskConical,
  Gauge,
  Play,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";

function OptionalNumberField({
  id,
  label,
  value,
  onChange,
  minimum,
  maximum,
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="font-mono text-[11px] font-semibold uppercase tracking-wide"
      >
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={minimum}
        max={maximum}
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-none font-mono"
      />
    </div>
  );
}

function optionalNumberIsValid(value, minimum, maximum, integer = true) {
  if (value === "") return true;
  const parsed = Number(value);
  return (
    Number.isFinite(parsed) &&
    parsed >= minimum &&
    parsed <= maximum &&
    (!integer || Number.isInteger(parsed))
  );
}

function maskContext(context) {
  return Object.fromEntries(
    Object.keys(context ?? {}).map((key) => [key, "[MASKED]"]),
  );
}

function redactPrompt(value, context) {
  if (typeof value === "string") {
    let redacted = value;
    for (const contextValue of Object.values(context ?? {})) {
      const sensitiveValue = String(contextValue);
      if (sensitiveValue) {
        redacted = redacted.replaceAll(
          sensitiveValue,
          "[REDACTED_CONTEXT]",
        );
      }
    }
    return redacted;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactPrompt(item, context));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        redactPrompt(item, context),
      ]),
    );
  }
  return value;
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function validationMessage(error) {
  const errors = error?.data?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    return errors
      .map((item) => `${item.field || "request"}: ${item.message}`)
      .join(" · ");
  }
  return error?.message ?? "";
}

function ResultMetric({ label, value }) {
  return (
    <div className="border-t border-black/15 py-3 dark:border-white/15">
      <dt className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words font-mono text-xs">{value}</dd>
    </div>
  );
}

export default function AiTestLabPanel({
  onRun,
  result,
  error,
  isRunning = false,
  sourceVersions = {},
}) {
  const [source, setSource] = useState("draft");
  const [feature, setFeature] = useState("chat");
  const [message, setMessage] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [budget, setBudget] = useState("");
  const [partySize, setPartySize] = useState("");
  const [tripDuration, setTripDuration] = useState("");

  const valid =
    message.trim().length >= 1 &&
    message.trim().length <= 4000 &&
    currentCity.trim().length <= 120 &&
    optionalNumberIsValid(budget, 0, Number.MAX_SAFE_INTEGER, false) &&
    optionalNumberIsValid(partySize, 1, 20) &&
    optionalNumberIsValid(tripDuration, 1, 14);

  const submit = (event) => {
    event.preventDefault();
    if (!valid || isRunning) return;
    const context = {};
    if (currentCity.trim()) context.currentCity = currentCity.trim();
    if (budget !== "") context.budget = Number(budget);
    if (partySize !== "") context.partySize = Number(partySize);
    if (tripDuration !== "") context.tripDuration = Number(tripDuration);
    onRun({
      source,
      feature,
      message: message.trim(),
      context,
    });
  };

  const provider = result?.provider ?? {};
  const version =
    result?.configVersion ??
    result?.version ??
    provider.version ??
    sourceVersions[source] ??
    "—";
  const reply =
    result?.reply ??
    result?.result ??
    result?.structuredResult ??
    result?.providerResult;
  const safety =
    result?.safety ??
    result?.safetyResult ??
    (result?.safetyBlocked === undefined
      ? null
      : { blocked: result.safetyBlocked });
  const prompt = result
    ? redactPrompt(result.renderedPrompt, result.context)
    : null;
  const errorText = validationMessage(error);

  return (
    <Card className="rounded-none border-black/20 shadow-none dark:border-white/20">
      <CardHeader className="border-b border-black/20 bg-primary/10 dark:border-white/20">
        <div className="flex items-start gap-3">
          <FlaskConical aria-hidden="true" className="mt-0.5 size-5" />
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Isolated request · isTest=true
            </p>
            <CardTitle className="mt-1 text-lg font-bold uppercase tracking-tight">
              Test Lab
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid min-w-0 p-0 xl:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.15fr)]">
        <form
          onSubmit={submit}
          className="space-y-5 border-b border-black/20 p-5 sm:p-6 xl:border-b-0 xl:border-r dark:border-white/20"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="ai-test-source"
                className="font-mono text-[11px] font-semibold uppercase tracking-wide"
              >
                Nguồn cấu hình
              </Label>
              <select
                id="ai-test-source"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="h-10 w-full rounded-none border border-input bg-background px-3 font-mono text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="ai-test-feature"
                className="font-mono text-[11px] font-semibold uppercase tracking-wide"
              >
                Tính năng
              </Label>
              <select
                id="ai-test-feature"
                value={feature}
                onChange={(event) => setFeature(event.target.value)}
                className="h-10 w-full rounded-none border border-input bg-background px-3 font-mono text-sm"
              >
                <option value="chat">Chat</option>
                <option value="planner">Planner</option>
                <option value="voice">Voice</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="ai-test-message"
              className="font-mono text-[11px] font-semibold uppercase tracking-wide"
            >
              Tin nhắn thử
            </Label>
            <Textarea
              id="ai-test-message"
              value={message}
              maxLength={4000}
              onChange={(event) => setMessage(event.target.value)}
              className="min-h-28 rounded-none"
            />
          </div>

          <fieldset className="border-t border-black/15 pt-5 dark:border-white/15">
            <legend className="px-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Optional bounded context
            </legend>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="ai-test-city"
                  className="font-mono text-[11px] font-semibold uppercase tracking-wide"
                >
                  Thành phố
                </Label>
                <Input
                  id="ai-test-city"
                  value={currentCity}
                  maxLength={120}
                  onChange={(event) => setCurrentCity(event.target.value)}
                  className="rounded-none"
                />
              </div>
              <OptionalNumberField
                id="ai-test-budget"
                label="Ngân sách"
                value={budget}
                minimum="0"
                maximum={Number.MAX_SAFE_INTEGER}
                onChange={setBudget}
              />
              <OptionalNumberField
                id="ai-test-party"
                label="Số người"
                value={partySize}
                minimum="1"
                maximum="20"
                onChange={setPartySize}
              />
              <OptionalNumberField
                id="ai-test-duration"
                label="Số ngày"
                value={tripDuration}
                minimum="1"
                maximum="14"
                onChange={setTripDuration}
              />
            </div>
          </fieldset>

          {errorText && (
            <p
              role="alert"
              className="border-l-4 border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {errorText}
            </p>
          )}

          <Button
            type="submit"
            loading={isRunning}
            disabled={!valid || isRunning}
            className="w-full rounded-none sm:w-auto"
          >
            <Play aria-hidden="true" />
            Chạy test
          </Button>
        </form>

        <section className="min-w-0 p-5 sm:p-6" aria-label="Kết quả Test Lab">
          {!result ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <Braces
                aria-hidden="true"
                className="size-8 text-muted-foreground"
              />
              <h3 className="mt-4 text-sm font-bold uppercase tracking-wide">
                Chưa có kết quả
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Kết quả chỉ tồn tại trên mutation hiện tại và không đi vào
                production query state.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Request {result.requestId ?? "—"}
                </p>
                <h3 className="mt-1 text-base font-bold uppercase tracking-tight">
                  Kết quả provider
                </h3>
              </div>

              <dl className="grid gap-x-6 sm:grid-cols-2">
                <ResultMetric
                  label="Provider / model / version"
                  value={`${provider.provider ?? "—"} / ${
                    provider.model ?? "—"
                  } / v${version}`}
                />
                <ResultMetric
                  label="Tokens"
                  value={`${
                    Number.isFinite(provider.inputTokens)
                      ? provider.inputTokens
                      : "—"
                  } in / ${
                    Number.isFinite(provider.outputTokens)
                      ? provider.outputTokens
                      : "—"
                  } out`}
                />
                <ResultMetric
                  label="Latency"
                  value={
                    Number.isFinite(provider.latencyMs)
                      ? `${provider.latencyMs} ms`
                      : "—"
                  }
                />
                <ResultMetric
                  label="Safety"
                  value={displayValue(safety)}
                />
              </dl>

              <div className="border-t border-black/20 pt-5 dark:border-white/20">
                <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Gauge aria-hidden="true" className="size-3.5" />
                  Masked context
                </p>
                <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap border-l-2 border-primary bg-muted/50 p-3 text-xs">
                  {JSON.stringify(maskContext(result.context), null, 2)}
                </pre>
              </div>

              <div className="border-t border-black/20 pt-5 dark:border-white/20">
                <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  <ShieldCheck aria-hidden="true" className="size-3.5" />
                  Redacted rendered prompt
                </p>
                <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap border-l-2 border-black/40 bg-muted/50 p-3 text-xs dark:border-white/40">
                  {JSON.stringify(prompt, null, 2)}
                </pre>
              </div>

              <div className="border-t border-black/20 pt-5 dark:border-white/20">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Result
                </p>
                <pre className="mt-2 whitespace-pre-wrap break-words text-sm">
                  {displayValue(reply)}
                </pre>
                {result.validationError && (
                  <p
                    role="alert"
                    className="mt-3 text-sm text-destructive"
                  >
                    {displayValue(result.validationError)}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
