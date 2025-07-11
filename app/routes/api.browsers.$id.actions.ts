import { json, type ActionFunctionArgs } from "@remix-run/node";
import { pauseBrowser, resumeBrowser, deleteBrowser } from "~/utils/browserize.server";
import { updateBrowserStatus, deleteBrowserRecord, getBrowserById } from "~/utils/db.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const dbBrowserId = params.id;
  if (!dbBrowserId) {
    return json({ error: "Browser ID is required" }, { status: 400 });
  }

  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (!action) {
    return json({ error: "Action is required" }, { status: 400 });
  }

  try {
    // Get the browser record to find the browserize browser_id
    const browser = await getBrowserById(parseInt(dbBrowserId));
    if (!browser) {
      return json({ error: "Browser not found" }, { status: 404 });
    }

    let result;
    
    switch (action) {
      case "pause":
        result = await pauseBrowser(browser.browser_id);
        if (result.success) {
          await updateBrowserStatus(parseInt(dbBrowserId), "paused");
        }
        return json({ success: true, action: "pause", bankedMs: result.bankedMs });

      case "resume":
        result = await resumeBrowser(browser.browser_id);
        if (result.success) {
          await updateBrowserStatus(parseInt(dbBrowserId), "running");
        }
        return json({ success: true, action: "resume" });

      case "delete":
        result = await deleteBrowser(browser.browser_id);
        if (result.success) {
          await deleteBrowserRecord(parseInt(dbBrowserId));
        }
        return json({ success: true, action: "delete" });

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error(`Failed to ${action} browser:`, error);
    return json(
      { error: `Failed to ${action} browser: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 