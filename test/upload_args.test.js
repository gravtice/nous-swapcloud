import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { normalizeUploadArgs } from "../src/upload_args.js";

test("normalizeUploadArgs: resolves paths and parses integers", () => {
  const cwd = "/tmp/swapcloud";
  const result = normalizeUploadArgs(
    {
      filePath: "a.txt",
      expiresInSeconds: "3600",
      objectTtlDays: "7",
    },
    cwd
  );

  assert.equal(result.localFilePath, path.resolve(cwd, "a.txt"));
  assert.equal(result.expiresInSeconds, 3600);
  assert.equal(result.objectTtlDays, 7);
});

test("normalizeUploadArgs: objectTtlDays is optional", () => {
  const cwd = "/tmp/swapcloud";
  const result = normalizeUploadArgs(
    { filePath: "a.txt", expiresInSeconds: 1 },
    cwd
  );

  assert.equal(result.localFilePath, path.resolve(cwd, "a.txt"));
  assert.equal(result.expiresInSeconds, 1);
  assert.equal(result.objectTtlDays, undefined);
});

test("normalizeUploadArgs: throws on missing filePath", () => {
  assert.throws(
    () => normalizeUploadArgs({ expiresInSeconds: 1 }),
    /filePath is required/
  );
});

test("normalizeUploadArgs: throws on missing expiresInSeconds", () => {
  assert.throws(() => normalizeUploadArgs({ filePath: "a.txt" }), /expiresInSeconds is required/);
});

test("normalizeUploadArgs: throws on invalid integers", () => {
  assert.throws(
    () => normalizeUploadArgs({ filePath: "a.txt", expiresInSeconds: 0 }),
    /expiresInSeconds must be a positive integer/
  );
  assert.throws(
    () =>
      normalizeUploadArgs({
        filePath: "a.txt",
        expiresInSeconds: 1,
        objectTtlDays: "1.5",
      }),
    /objectTtlDays must be a positive integer/
  );
});

