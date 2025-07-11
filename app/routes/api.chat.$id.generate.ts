import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { pool, getBrowserForChat } from "~/utils/db.server";
import { callAnthropic } from "~/utils/anthropic.server";

export const action: ActionFunction = async ({ params, request }) => {
  const chatId = Number(params.id);
  if (!chatId) return json({ error: "Invalid chat ID" }, { status: 400 });

  try {
    // Get mode from request body
    const { mode } = await request.json();
    const isAgentMode = mode === 'agent';
    
    // Get conversation history and MCP URL
    const { rows: messages } = await pool.query(
      "SELECT content, role FROM messages WHERE chat_id = $1 ORDER BY id ASC",
      [chatId]
    );

    // Get MCP URL from browser record, but only use it in agent mode
    let mcpUrl = null;
    if (isAgentMode) {
      const browser = await getBrowserForChat(chatId);
      mcpUrl = browser?.mcp_url;
    }

    console.log(`Chat ${chatId} Mode: ${mode}, MCP URL: ${mcpUrl || 'disabled'}`);

    // Convert to Anthropic format
    const anthropicMessages = messages.map((msg: any) => ({
      role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));

    // Different system messages based on mode
    let systemMessage = null;
    if (isAgentMode && mcpUrl) {
      systemMessage = "You have access to external tools via MCP. Use the available tools to help accomplish tasks. Always wait a few seconds after actions that change page state to ensure they complete.";
    } else {
      systemMessage = "You are a helpful AI assistant. Answer questions and provide information, but you cannot perform actions or use external tools.";
    }

    // Call Anthropic API with MCP support only in agent mode
    // Note: The anthropic server now handles saving the assistant message with progress data
    const response = await callAnthropic(anthropicMessages, mcpUrl, chatId.toString(), systemMessage);

    return json({ response });
  } catch (error) {
    console.error("Failed to generate AI response:", error);
    return json({ error: "Failed to generate response" }, { status: 500 });
  }
}; 