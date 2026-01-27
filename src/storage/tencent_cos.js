import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import COS from "cos-nodejs-sdk-v5";

const TTL_TAG_KEY = "swapcloud_ttl_days";

function requireEnv(env, key) {
  const value = env[key];
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  throw new Error(`Missing required env var: ${key}`);
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildObjectKey(prefix, localFilePath) {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");

  const base = sanitizeFilename(path.basename(localFilePath));
  const id = crypto.randomUUID();
  const parts = [prefix, yyyy, mm, dd, `${id}-${base}`].filter(Boolean);
  return parts.join("/");
}

function toCosErrorMessage(error) {
  if (!error || typeof error !== "object") return String(error);
  const code = "code" in error ? error.code : undefined;
  const message = "message" in error ? error.message : undefined;
  return [code, message].filter(Boolean).join(": ") || String(error);
}

function makeSignedUrlClickSafe(url) {
  if (typeof url !== "string") return url;
  // Tencent COS 的签名 URL 里包含 `;`（如 q-sign-time=START;END），某些客户端会在自动识别链接时截断。
  // 这里把 `;` 进行百分号编码，避免“点击后 403 AccessDenied”。
  return url.replaceAll(";", "%3B");
}

export function createTencentCosBackend(env = process.env) {
  const region = requireEnv(env, "TENCENT_COS_REGION");
  const bucket = requireEnv(env, "TENCENT_COS_BUCKET");
  const secretId = requireEnv(env, "TENCENT_COS_SECRET_ID");
  const secretKey = requireEnv(env, "TENCENT_COS_SECRET_KEY");
  const prefix = typeof env.TENCENT_COS_PREFIX === "string" ? env.TENCENT_COS_PREFIX.trim() : "";

  const cos = new COS({
    SecretId: secretId,
    SecretKey: secretKey,
  });

  async function putObject({ key, localFilePath }) {
    return await new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: bucket,
          Region: region,
          Key: key,
          Body: fs.createReadStream(localFilePath),
        },
        (err, data) => {
          if (err) return reject(err);
          resolve(data);
        }
      );
    });
  }

  async function putObjectTagging({ key, tags }) {
    return await new Promise((resolve, reject) => {
      cos.putObjectTagging(
        {
          Bucket: bucket,
          Region: region,
          Key: key,
          Tags: tags,
        },
        (err, data) => {
          if (err) return reject(err);
          resolve(data);
        }
      );
    });
  }

  async function deleteObject({ key }) {
    return await new Promise((resolve, reject) => {
      cos.deleteObject(
        {
          Bucket: bucket,
          Region: region,
          Key: key,
        },
        (err, data) => {
          if (err) return reject(err);
          resolve(data);
        }
      );
    });
  }

  function getSignedDownloadUrl({ key, expiresInSeconds }) {
    const url = cos.getObjectUrl({
      Bucket: bucket,
      Region: region,
      Key: key,
      Method: "GET",
      Sign: true,
      Expires: expiresInSeconds,
    });
    return makeSignedUrlClickSafe(url);
  }

  return {
    async uploadAndGetSignedUrl({
      localFilePath,
      expiresInSeconds,
      objectTtlDays,
    }) {
      const stat = await fs.promises.stat(localFilePath);
      if (!stat.isFile()) throw new Error("filePath must point to a regular file");

      const key = buildObjectKey(prefix, localFilePath);
      try {
        await putObject({ key, localFilePath });
      } catch (err) {
        throw new Error(`Tencent COS upload failed: ${toCosErrorMessage(err)}`);
      }

      if (objectTtlDays !== undefined) {
        try {
          await putObjectTagging({
            key,
            tags: [{ Key: TTL_TAG_KEY, Value: String(objectTtlDays) }],
          });
        } catch (err) {
          try {
            await deleteObject({ key });
          } catch {}
          throw new Error(
            `Tencent COS put object tagging failed: ${toCosErrorMessage(err)}`
          );
        }
      }

      try {
        const url = getSignedDownloadUrl({ key, expiresInSeconds });
        if (typeof url !== "string" || url.trim() === "") {
          throw new Error("empty url returned");
        }
        return { url, key };
      } catch (err) {
        throw new Error(`Tencent COS signed url failed: ${toCosErrorMessage(err)}`);
      }
    },
  };
}
