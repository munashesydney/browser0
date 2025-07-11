import { json } from "@remix-run/node";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { createBrowserRecord, getBrowsers } from "~/utils/db.server";

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

  const { name, content, role } = (data as { name?: unknown; content?: unknown; role?: unknown }) || {};

  if (!name || typeof name !== "string") {
    return json({ error: "Browser name is required" }, { status: 400 });
  }

  if (content && typeof content !== "string") {
    return json({ error: "Invalid content" }, { status: 400 });
  }

  try {
    const result = await createBrowserRecord(
      name.trim(),
      typeof content === "string" ? content.trim() : undefined,
      typeof role === "string" ? role : "user"
    );

    return json({ 
      browserId: result.browserId, 
      chatId: result.chatId,
      success: true 
    });
  } catch (error) {
    console.error("Failed to create browser:", error);
    return json({ error: "Failed to create browser" }, { status: 500 });
  }
};

export const loader: LoaderFunction = async () => {
  try {
    const browsers = await getBrowsers();
    return json({ browsers });
  } catch (error) {
    console.error("Failed to load browsers:", error);
    return json({ error: "Failed to load browsers" }, { status: 500 });
  }
}; 