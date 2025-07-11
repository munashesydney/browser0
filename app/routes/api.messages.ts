import { json } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { pool, createMessage } from "~/utils/db.server";

export const action: ActionFunction = async ({ request }) => {
  const { chatId, content, role } = await request.json();
  
  try {
    await createMessage(chatId, content, role);
    return json({ success: true });
  } catch (error) {
    console.error("Failed to save message:", error);
    return json({ error: "Failed to save message" }, { status: 500 });
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  
  if (!chatId) {
    return json({ error: "Chat ID is required" }, { status: 400 });
  }
  
  try {
    const { rows } = await pool.query(
      "SELECT content, role, progress_data FROM messages WHERE chat_id = $1 ORDER BY id ASC",
      [chatId]
    );
    
    // PostgreSQL JSONB columns automatically parse JSON, so no need to JSON.parse()
    const messages = rows.map(row => ({
      content: row.content,
      role: row.role,
      progress_data: row.progress_data // Already parsed by PostgreSQL
    }));
    
    return json({ messages });
  } catch (error) {
    console.error("Failed to load messages:", error);
    return json({ error: "Failed to load messages" }, { status: 500 });
  }
}; 