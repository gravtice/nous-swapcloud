import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { loadEnvFromFiles } from "../src/env.js";

function snapshotEnv(keys) {
  const snapshot = new Map();
  for (const key of keys) snapshot.set(key, process.env[key]);

  return () => {
    for (const key of keys) {
      const value = snapshot.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

async function makeTempDir() {
  return await fs.mkdtemp(path.join(os.tmpdir(), "nous-swapcloud-"));
}

test("loadEnvFromFiles: selects highest priority file in a root", async () => {
  const restore = snapshotEnv(["NOUS_SWAPCLOUD_TEST_ENV"]);
  const dir = await makeTempDir();
  try {
    await fs.writeFile(
      path.join(dir, ".env.production"),
      "NOUS_SWAPCLOUD_TEST_ENV=prod\n"
    );
    await fs.writeFile(
      path.join(dir, ".env.local"),
      "NOUS_SWAPCLOUD_TEST_ENV=local\n"
    );

    const result = loadEnvFromFiles([dir]);
    assert.equal(result.loaded, true);
    assert.equal(result.path, path.join(dir, ".env.local"));
    assert.equal(process.env.NOUS_SWAPCLOUD_TEST_ENV, "local");
  } finally {
    restore();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("loadEnvFromFiles: respects root order", async () => {
  const restore = snapshotEnv(["NOUS_SWAPCLOUD_TEST_ENV"]);
  const dir1 = await makeTempDir();
  const dir2 = await makeTempDir();
  try {
    await fs.writeFile(
      path.join(dir1, ".env.production"),
      "NOUS_SWAPCLOUD_TEST_ENV=prod\n"
    );
    await fs.writeFile(
      path.join(dir2, ".env.local"),
      "NOUS_SWAPCLOUD_TEST_ENV=local\n"
    );

    const result = loadEnvFromFiles([dir1, dir2]);
    assert.equal(result.loaded, true);
    assert.equal(result.path, path.join(dir1, ".env.production"));
    assert.equal(process.env.NOUS_SWAPCLOUD_TEST_ENV, "prod");
  } finally {
    restore();
    await fs.rm(dir1, { recursive: true, force: true });
    await fs.rm(dir2, { recursive: true, force: true });
  }
});

test("loadEnvFromFiles: does not override existing env", async () => {
  const restore = snapshotEnv(["NOUS_SWAPCLOUD_TEST_ENV"]);
  const dir = await makeTempDir();
  try {
    process.env.NOUS_SWAPCLOUD_TEST_ENV = "existing";
    await fs.writeFile(
      path.join(dir, ".env.local"),
      "NOUS_SWAPCLOUD_TEST_ENV=file\n"
    );

    const result = loadEnvFromFiles([dir]);
    assert.equal(result.loaded, true);
    assert.equal(process.env.NOUS_SWAPCLOUD_TEST_ENV, "existing");
  } finally {
    restore();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("loadEnvFromFiles: returns loaded=false when missing", async () => {
  const dir = await makeTempDir();
  try {
    const result = loadEnvFromFiles([dir]);
    assert.equal(result.loaded, false);
    assert.equal(result.path, null);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

