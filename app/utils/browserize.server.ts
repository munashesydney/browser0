import { env } from "process";

interface BrowserInfo {
  id: string;
  name: string;
  status: string;
  memory: number;
  cpu: number;
  uptime: string;
  vnc_url: string;
  novnc_url: string;
  debug_url: string;
  mcp_url: string;
}

interface BrowserActionResponse {
  success: boolean;
  browserId: string;
  bankedMs?: number;
}

export async function createBrowser(
  name: string,
  memory: string = "512",
  startUrl?: string
): Promise<BrowserInfo> {
  const apiKey = env.BROWSERIZE_API_KEY;
  if (!apiKey) {
    throw new Error("BROWSERIZE_API_KEY is not set in environment variables");
  }

  const res = await fetch("https://browserize-api.vercel.app/api/browsers/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, memory, startUrl }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Browserize API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    success: boolean;
    id: string;
    browser: BrowserInfo;
  };

  if (!data.success) {
    throw new Error("Browserize API returned success=false");
  }

  return data.browser;
}

export async function pauseBrowser(browserId: string): Promise<BrowserActionResponse> {
  const apiKey = env.BROWSERIZE_API_KEY;
  if (!apiKey) {
    throw new Error("BROWSERIZE_API_KEY is not set in environment variables");
  }

  const res = await fetch("https://browserize-api.vercel.app/api/browsers/pause", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ browserId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Browserize API error: ${res.status} ${text}`);
  }

  const data = await res.json() as BrowserActionResponse;
  
  if (!data.success) {
    throw new Error("Failed to pause browser");
  }

  return data;
}

export async function resumeBrowser(browserId: string): Promise<BrowserActionResponse> {
  const apiKey = env.BROWSERIZE_API_KEY;
  if (!apiKey) {
    throw new Error("BROWSERIZE_API_KEY is not set in environment variables");
  }

  const res = await fetch("https://browserize-api.vercel.app/api/browsers/resume", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ browserId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Browserize API error: ${res.status} ${text}`);
  }

  const data = await res.json() as BrowserActionResponse;
  
  if (!data.success) {
    throw new Error("Failed to resume browser");
  }

  return data;
}

export async function deleteBrowser(browserId: string): Promise<BrowserActionResponse> {
  const apiKey = env.BROWSERIZE_API_KEY;
  if (!apiKey) {
    throw new Error("BROWSERIZE_API_KEY is not set in environment variables");
  }

  const res = await fetch("https://browserize-api.vercel.app/api/browsers/delete", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ browserId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Browserize API error: ${res.status} ${text}`);
  }

  const data = await res.json() as BrowserActionResponse;
  
  if (!data.success) {
    throw new Error("Failed to delete browser");
  }

  return data;
} 