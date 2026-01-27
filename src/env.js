import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const ENV_FILES_BY_PRIORITY = [
  ".env.local",
  ".env.production",
  ".env.development",
  ".env.test",
];

function getProjectRoot() {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDir, "..");
}

export function loadEnvFromFiles(searchRoots = [process.cwd(), getProjectRoot()]) {
  const roots = Array.from(new Set(searchRoots.filter(Boolean)));
  for (const root of roots) {
    for (const filename of ENV_FILES_BY_PRIORITY) {
      const fullPath = path.join(root, filename);
      if (!fs.existsSync(fullPath)) continue;
      dotenv.config({ path: fullPath, override: false });
      return { loaded: true, path: fullPath };
    }
  }
  return { loaded: false, path: null };
}
