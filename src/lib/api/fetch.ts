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
import { showErrorToast } from "@/lib/toast/events";

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

const ERROR_MESSAGES: Record<string, string> = {
  TITLE_AND_CONTENT_REQUIRED: "필수 정보를 입력해주세요.",
  COMMENT_BODY_REQUIRED: "댓글 내용을 입력해주세요.",
  COMMENT_ACCEPTED_REQUIRED: "필수 정보를 입력해주세요.",
  COMMENT_ACCEPT_ONLY_FOR_QNA_OR_BUG: "채택할 수 없는 댓글입니다.",
  POST_MODIFY_FORBIDDEN: "권한이 없습니다.",
  COMMENT_MODIFY_FORBIDDEN: "권한이 없습니다.",
  COMMENT_DELETE_FORBIDDEN: "권한이 없습니다.",
  NOT_FOUND: "대상을 찾을 수 없습니다.",
  COMMENT_NOT_FOUND: "댓글을 찾을 수 없습니다.",
  "Email already exists": "이미 사용 중인 이메일입니다.",
  "Login is required": "로그인이 필요합니다.",
  "Invalid username or password": "아이디 또는 비밀번호를 확인해주세요.",
  "Bearer token is required": "로그인이 필요합니다.",
  "Invalid access token": "다시 로그인해주세요.",
  "Access token expired": "다시 로그인해주세요.",
};

const readPayloadMessage = (payload: unknown) => {
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload) as unknown;
      return readPayloadMessage(parsed);
    } catch {
      return payload;
    }
  }

  if (!payload || typeof payload !== "object") return "";
  const record = payload as { message?: unknown; error?: unknown };
  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;
  return "";
};

const getFriendlyErrorMessage = (status: number, payload: unknown) => {
  const code = readPayloadMessage(payload);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];

  if (status === 400 || status === 422) return "필수 정보를 입력해주세요.";
  if (status === 401) return "로그인이 필요합니다.";
  if (status === 403) return "권한이 없습니다.";
  if (status === 404) return "대상을 찾을 수 없습니다.";
  if (status === 409) return "이미 처리된 요청입니다.";
  if (status >= 500) return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  return "요청을 처리하지 못했습니다.";
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

  let res: Response;
  let payload: unknown;

  try {
    res = await send(accessToken);
    payload = await parsePayload(res);
  } catch {
    const message = "서버에 연결할 수 없습니다.";
    showErrorToast(message);
    throw new Error(message);
  }

  if (auth && method === "GET" && res.status === 401) {
    clearAuthSession();
    const guestToken = await issueFreshGuestToken();
    try {
      res = await send(guestToken);
      payload = await parsePayload(res);
    } catch {
      const message = "서버에 연결할 수 없습니다.";
      showErrorToast(message);
      throw new Error(message);
    }
  }

  if (!res.ok) {
    if (auth && res.status === 401) {
      clearAuthSession();
    }

    const message = getFriendlyErrorMessage(res.status, payload);
    showErrorToast(message);
    throw new Error(message);
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
