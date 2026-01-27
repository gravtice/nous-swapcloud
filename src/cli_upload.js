import { loadEnvFromFiles } from "./env.js";
import { createStorageBackend } from "./storage/index.js";
import { normalizeUploadArgs } from "./upload_args.js";

function takeOptionValue(argv, index, optionName) {
  const value = argv[index + 1];
  if (value === undefined) {
    throw new Error(`Missing value for ${optionName}`);
  }
  return value;
}

function parseUploadOptions(argv) {
  const args = { filePath: undefined, expiresInSeconds: undefined, objectTtlDays: undefined };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "-h" || arg === "--help") return { help: true };

    if (arg === "--file" || arg === "--filePath" || arg === "--file-path") {
      args.filePath = takeOptionValue(argv, i, arg);
      i++;
      continue;
    }
    if (arg.startsWith("--file=")) {
      args.filePath = arg.slice("--file=".length);
      continue;
    }

    if (
      arg === "--expires" ||
      arg === "--expiresInSeconds" ||
      arg === "--expires-in-seconds"
    ) {
      args.expiresInSeconds = takeOptionValue(argv, i, arg);
      i++;
      continue;
    }
    if (arg.startsWith("--expires=")) {
      args.expiresInSeconds = arg.slice("--expires=".length);
      continue;
    }

    if (arg === "--object-ttl-days" || arg === "--objectTtlDays") {
      args.objectTtlDays = takeOptionValue(argv, i, arg);
      i++;
      continue;
    }
    if (arg.startsWith("--object-ttl-days=")) {
      args.objectTtlDays = arg.slice("--object-ttl-days=".length);
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return { help: false, args };
}

function printUploadHelp() {
  process.stdout.write(`Usage:
  nous-swapcloud upload --file <path> --expires <seconds> [--object-ttl-days <days>]

Notes:
  - Config is loaded from .env files (no CLI config overrides).
  - Prints the signed download URL to stdout.
`);
}

export async function runCliUpload(argv) {
  const parsed = parseUploadOptions(argv);
  if (parsed.help) {
    printUploadHelp();
    return;
  }

  loadEnvFromFiles();
  const storage = createStorageBackend();

  const { localFilePath, expiresInSeconds, objectTtlDays } = normalizeUploadArgs({
    filePath: parsed.args.filePath,
    expiresInSeconds: parsed.args.expiresInSeconds,
    objectTtlDays: parsed.args.objectTtlDays,
  });

  const { url } = await storage.uploadAndGetSignedUrl({
    localFilePath,
    expiresInSeconds,
    objectTtlDays,
  });

  process.stdout.write(`${url}\n`);
}
