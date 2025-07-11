import { json } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { getChatsForBrowser, createChatForBrowser, getBrowserById } from "~/utils/db.server";

export const action: ActionFunction = async ({ params, request }) => {
  const browserId = Number(params.id);
  if (!browserId) return json({ error: "Invalid browser ID" }, { status: 400 });

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

  try {
    // Verify browser exists
    const browser = await getBrowserById(browserId);
    if (!browser) {
      return json({ error: "Browser not found" }, { status: 404 });
    }

    const chatId = await createChatForBrowser(
      browserId,
      typeof content === "string" ? content.trim() : undefined,
      typeof role === "string" ? role : "user"
    );

    return json({ 
      chatId,
      browserId,
      success: true 
    });
  } catch (error) {
    console.error("Failed to create chat:", error);
    return json({ error: "Failed to create chat" }, { status: 500 });
  }
};

export const loader: LoaderFunction = async ({ params }) => {
  const browserId = Number(params.id);
  if (!browserId) return json({ error: "Invalid browser ID" }, { status: 400 });

  try {
    const chats = await getChatsForBrowser(browserId);
    return json({ chats });
  } catch (error) {
    console.error("Failed to load chats:", error);
    return json({ error: "Failed to load chats" }, { status: 500 });
  }
}; 