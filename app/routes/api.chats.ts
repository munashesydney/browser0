import { json } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { createChat, getChats } from "~/utils/db.server";
import { pool } from "~/utils/db.server";

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { content, role } = (data as { content?: unknown; role?: unknown }) || {};

  if (content && typeof content !== "string") {
    return json({ error: "Invalid content" }, { status: 400 });
  }

  const chatId = await createChat(
    typeof content === "string" ? content.trim() : undefined,
    typeof role === "string" ? role : "user"
  );

  // fetch vnc_url from the browsers table (via chat's browser_id)
  const { rows } = await pool.query(`
    SELECT b.novnc_url 
    FROM browsers b 
    JOIN chats c ON b.id = c.browser_id 
    WHERE c.id = $1
  `, [chatId]);
  const novnc_url: string | null = rows[0]?.novnc_url || null;

  return json({ chatId, novnc_url });
};

export const loader: LoaderFunction = async () => {
  const chats = await getChats();
  return json({ chats });
}; 