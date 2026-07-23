#!/usr/bin/env node
/**
 * Creatorlayer MCP server — stdio transport.
 *
 * Configure in Claude Desktop / any MCP-compatible agent:
 *
 *   {
 *     "mcpServers": {
 *       "creatorlayer": {
 *         "command": "npx",
 *         "args": ["-y", "creatorlayer/mcp-server"],
 *         "env": {
 *           "CREATORLAYER_API_KEY": "cl_live_...",
 *           "CREATORLAYER_SANDBOX": "false"
 *         }
 *       }
 *     }
 *   }
 *
 * Or run directly after building:
 *   CREATORLAYER_API_KEY=$DEMO_API_KEY CREATORLAYER_SANDBOX=true node dist/mcp-server.js
 */
import { runMcpServer } from "./mcp.js";

runMcpServer().catch((err: unknown) => {
  process.stderr.write(`Creatorlayer MCP server fatal error: ${String(err)}\n`);
  process.exit(1);
});
