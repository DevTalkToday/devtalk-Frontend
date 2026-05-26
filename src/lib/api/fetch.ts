// "use client";

// type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// type RequestOptions = {
//   method: HttpMethod;
//   path: string;
//   data?: unknown;
//   auth?: boolean;
//   noStore?: boolean;
// };

// const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

// const parsePayload = async (res: Response) => {
//   const ct = res.headers.get("content-type") || "";
//   if (ct.includes("application/json")) {
//     try {
//       return await res.json();
//     } catch {
//       return null;
//     }
//   }
//   return await res.text();
// };

// const request = async ({ method, path, data, auth, noStore }: RequestOptions) => {
//   const accessToken = auth ? localStorage.getItem("accessToken") : null;

//   const res = await fetch(`${API_URL}${path}`, {
//     method,
//     headers: {
//       ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
//       "ngrok-skip-browser-warning": "true",
//       ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
//     },
//     body: data === undefined || data === null ? undefined : JSON.stringify(data),
//     cache: noStore ? "no-store" : "default",
//   });

//   const payload = await parsePayload(res);

//   if (!res.ok) {
//     const msg = typeof payload === "string" ? payload : JSON.stringify(payload);
//     throw new Error(msg);
//   }

//   return payload;
// };

// export const FetchGet = (path: string) =>
//   request({ method: "GET", path, auth: false, noStore: true });

// export const FetchPost = (path: string, data?: unknown) =>
//   request({ method: "POST", path, data, auth: false, noStore: true });

// export const FetchDelete = (path: string) =>
//   request({ method: "DELETE", path, auth: false, noStore: true });

// export const FetchGetAuth = (path: string) =>
//   request({ method: "GET", path, auth: true, noStore: true });

// export const FetchPostAuth = (path: string, data?: unknown) =>
//   request({ method: "POST", path, data, auth: true, noStore: true });

// export const FetchDeleteAuth = (path: string) =>
//   request({ method: "DELETE", path, auth: true, noStore: true });

"use client";

import { clearAuthSession, ensureAccessToken, issueFreshGuestToken } from "@/lib/auth/session";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method: HttpMethod;
  path: string;
  data?: unknown;
  auth?: boolean;
  noStore?: boolean;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

const resolveUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (/^https?:\/\//.test(path)) return path;

  // Next app routes such as /api/posts must stay on the frontend origin.
  if (normalizedPath.startsWith("/api/")) return normalizedPath;

  return API_URL ? `${API_URL}${normalizedPath}` : normalizedPath;
};

const parsePayload = async (res: Response) => {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return await res.text();
};

const request = async ({ method, path, data, auth, noStore }: RequestOptions) => {
  const accessToken = auth ? await ensureAccessToken() : null;
  const url = resolveUrl(path);

  const send = (token: string | null) => fetch(url, {
    method,
    headers: {
      ...(data === undefined || data === null ? {} : { "Content-Type": "application/json" }),
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data === undefined || data === null ? undefined : JSON.stringify(data),
    cache: noStore ? "no-store" : "default",
  });

  let res = await send(accessToken);
  let payload = await parsePayload(res);

  if (auth && method === "GET" && res.status === 401) {
    clearAuthSession();
    const guestToken = await issueFreshGuestToken();
    res = await send(guestToken);
    payload = await parsePayload(res);
  }

  if (!res.ok) {
    if (auth && res.status === 401) {
      clearAuthSession();
    }

    const msg = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(msg);
  }

  return payload;
};

export const FetchGet = (path: string) => request({ method: "GET", path, auth: true, noStore: true });
export const FetchPost = (path: string, data?: unknown) => request({ method: "POST", path, data, auth: false, noStore: true });
export const FetchPut = (path: string, data?: unknown) => request({ method: "PUT", path, data, auth: false, noStore: true });
export const FetchPatch = (path: string, data?: unknown) => request({ method: "PATCH", path, data, auth: false, noStore: true });
export const FetchDelete = (path: string) => request({ method: "DELETE", path, auth: false, noStore: true });

export const FetchGetAuth = (path: string) => request({ method: "GET", path, auth: true, noStore: true });
export const FetchPostAuth = (path: string, data?: unknown) => request({ method: "POST", path, data, auth: true, noStore: true });
export const FetchPutAuth = (path: string, data?: unknown) => request({ method: "PUT", path, data, auth: true, noStore: true });
export const FetchPatchAuth = (path: string, data?: unknown) => request({ method: "PATCH", path, data, auth: true, noStore: true });
export const FetchDeleteAuth = (path: string) => request({ method: "DELETE", path, auth: true, noStore: true });
