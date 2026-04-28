const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;

const INVALID_USERNAME_CHARS_REGEX = /[^a-zA-Z0-9_]+/g;
const MULTIPLE_UNDERSCORE_REGEX = /_+/g;
const EDGE_UNDERSCORE_REGEX = /^_+|_+$/g;

const emailLocalPart = (email) => String(email || "").split("@")[0] || "";

const normalizeBase = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(INVALID_USERNAME_CHARS_REGEX, "_")
    .replace(MULTIPLE_UNDERSCORE_REGEX, "_")
    .replace(EDGE_UNDERSCORE_REGEX, "")
    .toLowerCase()
    .trim();

const clampBaseLength = (value) => {
  const normalized = normalizeBase(value);
  if (!normalized) return "";
  if (normalized.length >= USERNAME_MIN_LENGTH) {
    return normalized.slice(0, USERNAME_MAX_LENGTH);
  }

  return `${normalized}${"_".repeat(USERNAME_MIN_LENGTH - normalized.length)}`;
};

const buildBaseCandidate = ({ preferred, email, fallback = "user" } = {}) => {
  return (
    clampBaseLength(preferred) ||
    clampBaseLength(emailLocalPart(email)) ||
    clampBaseLength(fallback) ||
    "user"
  );
};

const usernameExists = async (prismaClient, username, excludeUserId) => {
  const existing = await prismaClient.user.findFirst({
    where: {
      username,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existing);
};

export const normalizeUsernameInput = (value) => {
  const normalized = clampBaseLength(value);
  return normalized ? normalized.slice(0, USERNAME_MAX_LENGTH) : "";
};

export const generateUniqueUsername = async ({
  prismaClient,
  preferred,
  email,
  fallback = "user",
  excludeUserId,
} = {}) => {
  if (!prismaClient?.user) {
    throw new Error("prismaClient.user is required to generate username");
  }

  const base = buildBaseCandidate({ preferred, email, fallback });

  if (!(await usernameExists(prismaClient, base, excludeUserId))) {
    return base;
  }

  for (let attempt = 1; attempt <= 10000; attempt += 1) {
    const suffix = `_${attempt}`;
    const head = base.slice(
      0,
      Math.max(1, USERNAME_MAX_LENGTH - suffix.length),
    );
    const candidate = `${head}${suffix}`;

    if (!(await usernameExists(prismaClient, candidate, excludeUserId))) {
      return candidate;
    }
  }

  const entropy = Date.now().toString(36).slice(-6);
  const suffix = `_${entropy}`;
  const head = base.slice(0, Math.max(1, USERNAME_MAX_LENGTH - suffix.length));
  return `${head}${suffix}`;
};
