import path from "node:path";

export const resolveSensitiveStorageDir = ({
  currentWorkingDirectory = process.cwd(),
  configuredDirectory = process.env.SENSITIVE_STORAGE_DIR,
  nodeEnvironment = process.env.NODE_ENV,
} = {}) => {
  if (nodeEnvironment === "production") {
    if (!configuredDirectory || !path.isAbsolute(configuredDirectory)) {
      throw new Error(
        "SENSITIVE_STORAGE_DIR must be an absolute path in production",
      );
    }
    const resolvedDirectory = path.resolve(configuredDirectory);
    const applicationDirectory = path.resolve(currentWorkingDirectory);
    const relativeToApplication = path.relative(
      applicationDirectory,
      resolvedDirectory,
    );
    if (
      relativeToApplication === "" ||
      (!relativeToApplication.startsWith(`..${path.sep}`) &&
        relativeToApplication !== ".." &&
        !path.isAbsolute(relativeToApplication))
    ) {
      throw new Error(
        "SENSITIVE_STORAGE_DIR must be outside the application deployment directory in production",
      );
    }
    return resolvedDirectory;
  }

  return path.resolve(
    currentWorkingDirectory,
    configuredDirectory || "storage/sensitive",
  );
};
