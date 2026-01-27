import { createTencentCosBackend } from "./tencent_cos.js";

export function createStorageBackend(env = process.env) {
  const backend = String(env.BACKEND || "").trim().toUpperCase();

  switch (backend) {
    case "TENCENT_COS":
      return createTencentCosBackend(env);
    default:
      throw new Error(
        `Unsupported BACKEND=${JSON.stringify(backend)} (supported: TENCENT_COS)`
      );
  }
}
