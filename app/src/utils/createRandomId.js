import * as Crypto from "expo-crypto";

export const createRandomId = (prefix = "id") => {
  return `${prefix}-${Crypto.randomUUID()}`;
};
