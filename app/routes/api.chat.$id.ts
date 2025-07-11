import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { pool, getBrowserForChat } from "~/utils/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const id = Number(params.id);
  if (!id) return json({ error: "Invalid id" }, { status: 400 });

  const chatRes = await pool.query("SELECT * FROM chats WHERE id=$1", [id]);
  if (chatRes.rowCount === 0) return json({ error: "Not found" }, { status: 404 });

  const chat = chatRes.rows[0];
  const messagesRes = await pool.query(
    "SELECT content, role, created_at FROM messages WHERE chat_id=$1 ORDER BY id ASC",
    [id]
  );
  
  // Get browser information for this chat
  const browser = await getBrowserForChat(id);
  
  return json({ 
    chat, 
    messages: messagesRes.rows,
    browser: browser 
  });
}; 