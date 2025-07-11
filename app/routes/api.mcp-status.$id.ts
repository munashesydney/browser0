import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { pool, getBrowserForChat } from "~/utils/db.server";
import { healthCheckMCPClient } from "~/utils/mcp.server";

export const loader: LoaderFunction = async ({ params }) => {
  const chatId = Number(params.id);
  
  if (!chatId) {
    return json({ error: "Invalid chat ID" }, { status: 400 });
  }

  try {
    // Get browser information for this chat
    const browser = await getBrowserForChat(chatId);

    if (!browser) {
      return json({ error: "Browser not found for this chat" }, { status: 404 });
    }

    const mcpUrl = browser.mcp_url;
    const browserStatus = browser.status;

    if (!mcpUrl) {
      return json({
        connected: false,
        toolsCount: 0,
        error: "No MCP URL available",
      });
    }

    // Check MCP connection health
    const healthStatus = await healthCheckMCPClient(mcpUrl);

    return json({
      connected: healthStatus.connected,
      toolsCount: healthStatus.toolsCount,
      error: healthStatus.error,
      browserStatus: browserStatus,
      mcpUrl: mcpUrl, // For debugging (remove in production)
    });

  } catch (error) {
    console.error("Failed to check MCP status:", error);
    return json({
      connected: false,
      toolsCount: 0,
      error: "Failed to check MCP status",
    }, { status: 500 });
  }
}; 