#!/usr/bin/env node
function printHelp() {
  process.stdout.write(`Nous SwapCloud

Usage:
  nous-swapcloud
    Start stdio MCP server (default).

  nous-swapcloud upload --file <path> --expires <seconds> [--object-ttl-days <days>]
    Upload a local file and print the signed download URL.

  nous-swapcloud -h | --help
    Show this help.
`);
}

const argv = process.argv.slice(2);
const command = argv[0];

if (command === undefined) {
  await import("../src/index.js");
} else if (command === "upload") {
  try {
    const { runCliUpload } = await import("../src/cli_upload.js");
    await runCliUpload(argv.slice(1));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
} else if (command === "-h" || command === "--help" || command === "help") {
  printHelp();
} else {
  process.stderr.write(`Unknown command: ${command}\n\n`);
  printHelp();
  process.exitCode = 2;
}
