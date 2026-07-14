export const createRandomId = (prefix = "id") => {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID !== "function") {
    throw new Error("Secure random UUID is unavailable in this runtime.");
  }
  return `${prefix}-${randomUUID.call(globalThis.crypto)}`;
};
