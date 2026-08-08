import * as Crypto from "expo-crypto";

export const createRandomId = (prefix = "id") => `${prefix}-${Crypto.randomUUID()}`;
