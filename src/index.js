import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createRequire } from "node:module";

import { loadEnvFromFiles } from "./env.js";
import { createStorageBackend } from "./storage/index.js";
import { normalizeUploadArgs } from "./upload_args.js";

loadEnvFromFiles();
const storage = createStorageBackend();

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const server = new Server(
  { name: "nous-swapcloud", version: pkg.version },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "swapcloud_upload",
        description: "上传本地文件到交换存储并返回临时下载链接",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            filePath: {
              type: "string",
              description: "本地文件路径（绝对或相对当前工作目录）",
            },
            expiresInSeconds: {
              type: "integer",
              minimum: 1,
              description: "下载链接有效期（秒）",
            },
            objectTtlDays: {
              type: "integer",
              minimum: 1,
              description:
                "上传对象 TTL（天）；Tencent COS 后端会写入 object tag，需配合桶生命周期规则自动删除",
            },
          },
          required: ["filePath", "expiresInSeconds"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "swapcloud_upload") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { localFilePath, expiresInSeconds, objectTtlDays } = normalizeUploadArgs(
    request.params.arguments
  );

  const { url } = await storage.uploadAndGetSignedUrl({
    localFilePath,
    expiresInSeconds,
    objectTtlDays,
  });

  return {
    content: [{ type: "text", text: url }],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
