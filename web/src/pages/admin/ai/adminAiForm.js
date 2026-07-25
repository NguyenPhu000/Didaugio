/**
 * Converts the read-only configuration response into editable form state.
 * Provider credentials are intentionally represented by metadata only.
 */
export function toAiConfigForm(apiData = {}) {
  const credential = apiData.providerCredential ?? apiData.credential ?? {};
  const draft = apiData.draftVersion ?? apiData.draft ?? {};

  return {
    revision: apiData.revision ?? 0,
    configData: draft.configData ?? {},
    providerSecret: "",
    credentialConfigured: credential.configured === true,
    credentialSuffix: credential.suffix ?? "",
  };
}

/**
 * Prepares the draft write contract without ever retaining an old secret.
 */
export function toAiDraftPayload(form, revision, reason) {
  const payload = {
    revision,
    configData: form.configData,
    changeReason: reason,
  };

  if (form.providerSecret?.trim()) {
    payload.providerSecret = form.providerSecret.trim();
  }

  return payload;
}
