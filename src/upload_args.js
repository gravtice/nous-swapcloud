import path from "node:path";

function requireNonEmptyString(value, name) {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  throw new Error(`${name} is required`);
}

function parsePositiveInteger(value, name, { optional = false } = {}) {
  if (value == null) {
    if (optional) return undefined;
    throw new Error(`${name} is required`);
  }

  let num = value;
  if (typeof num === "string") {
    const trimmed = num.trim();
    if (trimmed === "") {
      if (optional) return undefined;
      throw new Error(`${name} is required`);
    }
    num = Number(trimmed);
  }

  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return num;
}

export function normalizeUploadArgs(inputArgs, cwd = process.cwd()) {
  const args = inputArgs && typeof inputArgs === "object" ? inputArgs : {};

  const filePath = requireNonEmptyString(args.filePath, "filePath");
  const localFilePath = path.resolve(cwd, filePath);

  const expiresInSeconds = parsePositiveInteger(args.expiresInSeconds, "expiresInSeconds");
  const objectTtlDays = parsePositiveInteger(args.objectTtlDays, "objectTtlDays", {
    optional: true,
  });

  return { localFilePath, expiresInSeconds, objectTtlDays };
}

