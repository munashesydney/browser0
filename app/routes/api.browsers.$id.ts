import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { getBrowserById } from "~/utils/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const id = Number(params.id);
  if (!id) return json({ error: "Invalid browser ID" }, { status: 400 });

  try {
    const browser = await getBrowserById(id);
    if (!browser) {
      return json({ error: "Browser not found" }, { status: 404 });
    }

    return json({ browser });
  } catch (error) {
    console.error("Failed to load browser:", error);
    return json({ error: "Failed to load browser" }, { status: 500 });
  }
}; 