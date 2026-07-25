import { useMemo, useState } from "react";
import {
  Ban,
  Download,
  Power,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { toAiConfigForm, toAiDraftPayload } from "../adminAiForm";

function collapseWhitespace(value) {
  let output = "";
  let pendingSpace = false;
  for (const character of value) {
    if (character.trim() === "") {
      pendingSpace = output.length > 0;
      continue;
    }
    if (pendingSpace) output += " ";
    output += character;
    pendingSpace = false;
  }
  return output;
}

export function normalizeSafetyKeyword(value, diacriticInsensitive = false) {
  const collapsed = collapseWhitespace(
    String(value ?? "").normalize("NFC").trim().toLocaleLowerCase("vi-VN"),
  );
  if (!diacriticInsensitive) return collapsed;

  let output = "";
  for (const character of collapsed.normalize("NFD")) {
    const codePoint = character.codePointAt(0);
    if (codePoint >= 0x0300 && codePoint <= 0x036f) continue;
    output += character === "đ" ? "d" : character;
  }
  return output;
}

function keywordValidationError(keywords, diacriticInsensitive) {
  if (keywords.length > 500) return "Tối đa 500 từ khóa.";
  const normalized = new Set();
  for (const keyword of keywords) {
    const value = collapseWhitespace(String(keyword ?? "").trim());
    if (!value) return "Từ khóa không được để trống.";
    if (value.length > 120) return "Mỗi từ khóa tối đa 120 ký tự.";
    const key = normalizeSafetyKeyword(value, diacriticInsensitive);
    if (normalized.has(key)) return "Từ khóa đã tồn tại.";
    normalized.add(key);
  }
  return null;
}

function parseFirstCsvCell(row) {
  if (!row.startsWith('"')) return row.split(",")[0];
  let output = "";
  for (let index = 1; index < row.length; index += 1) {
    const character = row[index];
    if (character !== '"') {
      output += character;
      continue;
    }
    if (row[index + 1] === '"') {
      output += '"';
      index += 1;
      continue;
    }
    break;
  }
  return output;
}

function parseKeywordCsv(source) {
  const normalizedLines = source
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .split("\n");
  while (
    normalizedLines.length > 0 &&
    normalizedLines[normalizedLines.length - 1] === ""
  ) {
    normalizedLines.pop();
  }
  if (
    normalizedLines[0]?.trim().toLocaleLowerCase("vi-VN") === "keyword"
  ) {
    normalizedLines.shift();
  }
  return normalizedLines.map((row) => parseFirstCsvCell(row));
}

function toKeywordCsv(keywords) {
  const rows = keywords.map(
    (keyword) => `"${String(keyword).replaceAll('"', '""')}"`,
  );
  return ["keyword", ...rows].join("\r\n");
}

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="border-l-4 border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  );
}

function AiSafetyPanelForm({
  config,
  permissions,
  onSaveDraft,
  onKillSwitch,
  killSwitchEnabled = false,
  isSaving = false,
}) {
  const mappedForm = toAiConfigForm(config);
  const initialSafety = mappedForm.configData?.safety;
  const [keywords, setKeywords] = useState(
    initialSafety?.blockedKeywords ?? [],
  );
  const [diacriticInsensitive, setDiacriticInsensitive] = useState(
    initialSafety?.diacriticInsensitive ?? false,
  );
  const [safeResponse, setSafeResponse] = useState(
    initialSafety?.safeResponse ?? "",
  );
  const [newKeyword, setNewKeyword] = useState("");
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");
  const canManage = permissions.manage === true;
  const keywordError = keywordValidationError(
    keywords,
    diacriticInsensitive,
  );
  const csvHref = useMemo(
    () =>
      `data:text/csv;charset=utf-8,${encodeURIComponent(
        toKeywordCsv(keywords),
      )}`,
    [keywords],
  );

  const addKeyword = () => {
    const candidate = collapseWhitespace(newKeyword.trim());
    const nextKeywords = [...keywords, candidate];
    const error = keywordValidationError(
      nextKeywords,
      diacriticInsensitive,
    );
    if (error) {
      setValidationError(error);
      return;
    }
    setKeywords(nextKeywords);
    setNewKeyword("");
    setValidationError("");
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const importedKeywords = parseKeywordCsv(await file.text());
    const nextKeywords = [...keywords, ...importedKeywords];
    const error = keywordValidationError(
      nextKeywords,
      diacriticInsensitive,
    );
    if (error) {
      setValidationError(error);
      return;
    }
    setKeywords(nextKeywords.map((keyword) => collapseWhitespace(keyword)));
    setValidationError("");
  };

  const saveSafety = (event) => {
    event.preventDefault();
    const error = keywordValidationError(
      keywords,
      diacriticInsensitive,
    );
    if (
      !canManage ||
      error ||
      !safeResponse.trim() ||
      safeResponse.trim().length > 1000 ||
      reason.trim().length < 5
    ) {
      setValidationError(error ?? "Kiểm tra phản hồi và lý do thay đổi.");
      return;
    }

    const nextConfig = {
      ...mappedForm.configData,
      safety: {
        blockedKeywords: keywords,
        matchMode: "substring",
        diacriticInsensitive,
        safeResponse: safeResponse.trim(),
      },
    };
    onSaveDraft(
      toAiDraftPayload(
        { configData: nextConfig, providerSecret: "" },
        mappedForm.revision,
        reason.trim(),
      ),
    );
  };

  if (!initialSafety) return null;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <Card className="rounded-none border-black/20 shadow-none dark:border-white/20">
        <CardHeader className="border-b border-black/20 bg-primary/10 dark:border-white/20">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5" />
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Input + output guard
              </p>
              <CardTitle className="mt-1 text-lg font-bold uppercase tracking-tight">
                Safety rules
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <form onSubmit={saveSafety}>
            <div className="border-b border-black/15 p-5 sm:p-6 dark:border-white/15">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-wide">
                    Substring cố định
                  </p>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Phase 1 chặn khi từ khóa xuất hiện trong chuỗi đầu vào hoặc
                    đầu ra.
                  </p>
                </div>
                <p className="font-mono text-xs font-semibold tabular-nums">
                  {keywords.length} / 500 từ khóa
                </p>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {canManage && (
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-2">
                    <Label
                      htmlFor="ai-new-keyword"
                      className="font-mono text-[11px] font-semibold uppercase tracking-wide"
                    >
                      Từ khóa mới
                    </Label>
                    <Input
                      id="ai-new-keyword"
                      value={newKeyword}
                      onChange={(event) => {
                        setNewKeyword(event.target.value);
                        setValidationError("");
                      }}
                      className="rounded-none"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!newKeyword.trim()}
                    onClick={addKeyword}
                    className="self-end rounded-none border-black dark:border-white"
                  >
                    <Ban aria-hidden="true" />
                    Thêm từ khóa
                  </Button>
                </div>
              )}

              <ErrorMessage message={validationError} />

              <div className="divide-y divide-black/10 border-y border-black/15 dark:divide-white/10 dark:border-white/15">
                {keywords.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Chưa có từ khóa chặn.
                  </p>
                ) : (
                  keywords.map((keyword, index) => (
                    <div
                      key={`${keyword}-${index}`}
                      className="flex min-h-11 items-center justify-between gap-4 py-2"
                    >
                      <code className="min-w-0 break-all text-xs">
                        {keyword}
                      </code>
                      {canManage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Xóa ${keyword}`}
                          onClick={() => {
                            setKeywords((current) =>
                              current.filter(
                                (_, keywordIndex) => keywordIndex !== index,
                              ),
                            );
                            setValidationError("");
                          }}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {canManage && (
                  <label className="inline-flex h-9 cursor-pointer items-center gap-2 border border-input px-3 text-sm font-medium">
                    <Upload aria-hidden="true" className="size-4" />
                    Nhập CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      aria-label="Nhập CSV"
                      onChange={importCsv}
                      className="sr-only"
                    />
                  </label>
                )}
                <a
                  href={csvHref}
                  download="ai-blocked-keywords.csv"
                  className="inline-flex h-9 items-center gap-2 border border-input px-3 text-sm font-medium"
                >
                  <Download aria-hidden="true" className="size-4" />
                  Xuất CSV
                </a>
              </div>

              <label className="flex items-start gap-3 border-y border-black/15 py-4 dark:border-white/15">
                <input
                  type="checkbox"
                  checked={diacriticInsensitive}
                  onChange={(event) => {
                    setDiacriticInsensitive(event.target.checked);
                    setValidationError("");
                  }}
                  disabled={!canManage}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>
                  <span className="block font-mono text-[11px] font-semibold uppercase tracking-wide">
                    Không phân biệt dấu
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Chuẩn hóa dấu tiếng Việt trước khi so sánh chuỗi con.
                  </span>
                </span>
              </label>

              <div className="space-y-2">
                <Label
                  htmlFor="ai-safe-response"
                  className="font-mono text-[11px] font-semibold uppercase tracking-wide"
                >
                  Phản hồi an toàn
                </Label>
                <Textarea
                  id="ai-safe-response"
                  value={safeResponse}
                  maxLength={1000}
                  onChange={(event) => setSafeResponse(event.target.value)}
                  disabled={!canManage}
                  className="min-h-24 rounded-none"
                />
              </div>
            </div>

            {canManage && (
              <div className="sticky bottom-0 flex flex-col gap-3 border-t border-black/30 bg-background/95 p-4 sm:flex-row sm:items-end dark:border-white/30">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label
                    htmlFor="ai-safety-reason"
                    className="font-mono text-[11px] font-semibold uppercase tracking-wide"
                  >
                    Lý do thay đổi safety
                  </Label>
                  <Input
                    id="ai-safety-reason"
                    value={reason}
                    maxLength={300}
                    onChange={(event) => setReason(event.target.value)}
                    className="rounded-none"
                  />
                </div>
                <Button
                  type="submit"
                  loading={isSaving}
                  disabled={
                    isSaving ||
                    Boolean(keywordError) ||
                    !safeResponse.trim() ||
                    reason.trim().length < 5
                  }
                  className="rounded-none"
                >
                  <Save aria-hidden="true" />
                  Lưu safety draft
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <aside className="h-fit border border-black/30 bg-card p-5 dark:border-white/30">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Emergency control
        </p>
        <h3 className="mt-2 text-base font-bold uppercase tracking-tight">
          Kill switch
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Runtime hiện{" "}
          <strong>{killSwitchEnabled ? "đang bị tắt" : "đang hoạt động"}</strong>.
          Thao tác luôn cần lý do và xác nhận riêng.
        </p>
        {permissions.killSwitch && onKillSwitch && (
          <Button
            type="button"
            variant={killSwitchEnabled ? "outline" : "destructive"}
            onClick={onKillSwitch}
            className="mt-5 w-full rounded-none"
          >
            <Power aria-hidden="true" />
            {killSwitchEnabled ? "Bật lại AI" : "Tắt AI"}
          </Button>
        )}
      </aside>
    </div>
  );
}

export default function AiSafetyPanel(props) {
  return (
    <AiSafetyPanelForm
      key={props.config?.revision ?? "unloaded"}
      {...props}
    />
  );
}
