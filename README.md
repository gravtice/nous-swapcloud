# Nous SwapCloud Tool

[![npm version](https://img.shields.io/npm/v/@gravtice/nous-swapcloud.svg)](https://www.npmjs.com/package/@gravtice/nous-swapcloud)
[![license](https://img.shields.io/npm/l/@gravtice/nous-swapcloud.svg)](https://github.com/Gravtice/nous-swapcloud/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/@gravtice/nous-swapcloud.svg)](https://nodejs.org/)

Upload files, get signed URLs. For multimodal AI, file sharing, or large API payloads.

上传文件到云存储，获取临时下载链接。适用于多模态 AI 理解、文件分享、大体积 API 传参等场景。

## Features

- **MCP Server**：stdio MCP server，支持 Claude Code / Cursor / Gemini CLI 等
- **CLI**：`upload` 命令直接上传，不依赖 MCP 客户端
- **Agent Skill**：通过 `nous-skills` 仓库安装，集成到 AI agent 工作流
- **点击安全**：自动编码签名 URL 中的 `;`，避免链接被截断
- **零配置参数**：自动加载 `.env.local` 等配置文件
- **对象 TTL**：可选，配合 COS 生命周期自动清理

## Requirements

- Node.js >= 20
- Tencent COS Bucket + SecretId/SecretKey
- 权限：`PutObject` + `GetObject`（使用 TTL 功能需额外 `PutObjectTagging`）

## Quick Start

### 1. 配置

创建 `.env.local`：

> 建议：`cp .env.example .env.local` 后再填写真实配置。  
> 注意：`npx` 默认从**当前工作目录**加载 `.env.local`（以及 `.env.production/.env.development/.env.test`），请在包含该文件的目录运行命令；或在 MCP 客户端配置里直接提供 env。

```dotenv
BACKEND=TENCENT_COS
TENCENT_COS_REGION=ap-guangzhou
TENCENT_COS_BUCKET=your-bucket-1250000000
TENCENT_COS_SECRET_ID=AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TENCENT_COS_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TENCENT_COS_PREFIX=swapcloud  # 可选前缀
```

### 2. 使用

**CLI 上传：**

```bash
npx -y @gravtice/nous-swapcloud upload --file ./example.txt --expires 3600
```

**MCP Server：**

```bash
npx -y @gravtice/nous-swapcloud
```

**Agent Skill（安装到 Codex CLI）：**

```bash
npx skills add gravtice/nous-skills -s nous-swapcloud
```

> 镜像源问题？添加 `--registry=https://registry.npmjs.org/`

## MCP 客户端配置

### 通用 JSON

适用于大多数 MCP 客户端（Cursor、Gemini CLI 等）：

```json
{
  "mcpServers": {
    "swapcloud": {
      "command": "npx",
      "args": ["-y", "@gravtice/nous-swapcloud"],
      "env": {
        "BACKEND": "TENCENT_COS",
        "TENCENT_COS_REGION": "ap-guangzhou",
        "TENCENT_COS_BUCKET": "your-bucket-1250000000",
        "TENCENT_COS_SECRET_ID": "AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "TENCENT_COS_SECRET_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add --transport stdio \
  -e BACKEND=TENCENT_COS \
  -e TENCENT_COS_REGION=ap-guangzhou \
  -e TENCENT_COS_BUCKET=your-bucket-1250000000 \
  -e TENCENT_COS_SECRET_ID=AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  -e TENCENT_COS_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
  swapcloud -- npx -y @gravtice/nous-swapcloud
```

<details>
<summary>其他客户端配置</summary>

#### Codex CLI (`~/.codex/config.toml`)

```toml
[mcp_servers.swapcloud]
command = "npx"
args = ["-y", "@gravtice/nous-swapcloud"]

[mcp_servers.swapcloud.env]
BACKEND = "TENCENT_COS"
TENCENT_COS_REGION = "ap-guangzhou"
TENCENT_COS_BUCKET = "your-bucket-1250000000"
TENCENT_COS_SECRET_ID = "AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TENCENT_COS_SECRET_KEY = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### Gemini CLI (`~/.gemini/settings.json`)

```json
{
  "mcpServers": {
    "swapcloud": {
      "command": "npx",
      "args": ["-y", "@gravtice/nous-swapcloud"],
      "env": {
        "BACKEND": "TENCENT_COS",
        "TENCENT_COS_REGION": "ap-guangzhou",
        "TENCENT_COS_BUCKET": "your-bucket-1250000000",
        "TENCENT_COS_SECRET_ID": "AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "TENCENT_COS_SECRET_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

#### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "swapcloud": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@gravtice/nous-swapcloud"],
      "env": {
        "BACKEND": "TENCENT_COS",
        "TENCENT_COS_REGION": "ap-guangzhou",
        "TENCENT_COS_BUCKET": "your-bucket-1250000000",
        "TENCENT_COS_SECRET_ID": "AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "TENCENT_COS_SECRET_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

</details>

## MCP Tool

### `swapcloud_upload`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `filePath` | string | Yes | 本地文件路径 |
| `expiresInSeconds` | integer | Yes | 链接有效期（秒） |
| `objectTtlDays` | integer | No | 对象 TTL（天），需配合 COS 生命周期 |

**返回**：签名下载 URL（纯文本）

## Agent Skill

该 Skill 已迁移到独立仓库：

- 安装命令：`npx skills add gravtice/nous-skills -s nous-swapcloud`
- 源代码：<https://github.com/gravtice/nous-skills/tree/main/skills/nous-swapcloud>

**Claude Code 示例：**

```
请先阅读 https://github.com/gravtice/nous-skills/tree/main/skills/nous-swapcloud
然后把 ./data.json 上传，expires=600，只返回 URL
```

## TTL 说明

| 类型 | 参数 | 粒度 | 说明 |
|------|------|------|------|
| 链接 TTL | `expiresInSeconds` | 秒 | 签名 URL 过期时间 |
| 对象 TTL | `objectTtlDays` | 天 | 需在 COS 配置生命周期规则 |

对象 TTL 通过 tag `swapcloud_ttl_days=<days>` 标记，需在 COS 控制台配置匹配规则才会自动删除。

## Troubleshooting

### AccessDenied (403)

- 检查密钥是否有 `GetObject` 权限（仅 `PutObject` 无法下载）
- 链接被截断？本工具已自动编码 `;`，若仍有问题请检查客户端

### command not found

npm 镜像未同步，使用官方源：

```bash
npx -y --registry=https://registry.npmjs.org/ @gravtice/nous-swapcloud
```

或永久配置：`~/.npmrc` 添加 `@gravtice:registry=https://registry.npmjs.org/`

## License

[MIT](LICENSE)
