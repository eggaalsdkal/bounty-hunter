import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Compute API base URL:
// - Explicit VITE_API_URL: used when frontend is deployed separately from backend (e.g. Railway)
// - Local dev: empty string (same origin, Express serves both frontend + API on port 5000)
// - Deployed (proxy): walk up from /web/direct-files/.../dist/public/ to proxy root, then /port/5000
function getApiBase(): string {
  // Check for explicit API URL (set when frontend is deployed separately from backend)
  const explicitUrl = import.meta.env.VITE_API_URL;
  if (explicitUrl) return explicitUrl;

  const placeholder = "__PORT_5000__";
  if (placeholder.startsWith("__")) {
    // Not replaced = local dev, use relative (same origin)
    return "";
  }
  // Deployed: placeholder was replaced with "port/5000"
  // We need the absolute proxy path: extract everything before /web/ from the current URL
  const loc = window.location;
  const webIdx = loc.pathname.indexOf("/web/");
  if (webIdx !== -1) {
    // e.g. /sites/proxy/JWT/web/... → /sites/proxy/JWT/port/5000
    return loc.origin + loc.pathname.substring(0, webIdx) + "/" + placeholder;
  }
  // Fallback
  return "/" + placeholder;
}

const API_BASE = getApiBase();

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(`${API_BASE}${queryKey.join("/")}`, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      // Proxy errors (403/503) or server down — treat as null so app still loads
      if (res.status === 403 || res.status === 503 || res.status === 502) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch {
      // Network error (server unreachable) — return null so app falls back to demo data
      return null;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
