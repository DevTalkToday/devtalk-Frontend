export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError<T = unknown> extends Error {
  status: number;
  url: string;
  payload?: T;

  constructor(args: { status: number; url: string; message?: string; payload?: T }) {
    super(args.message ?? `API Error (${args.status})`);
    this.name = "ApiError";
    this.status = args.status;
    this.url = args.url;
    this.payload = args.payload;
  }
}

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

export type RequestOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  query?: QueryParams;
  body?: unknown;
  signal?: AbortSignal;
  authToken?: string;
  credentials?: RequestCredentials;
};

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";

const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url);

const buildUrl = (path: string, query?: QueryParams) => {
  const urlStr = isAbsoluteUrl(path)
    ? path
    : `${baseURL}${path.startsWith("/") ? "" : "/"}${path}`;

  if (!query || Object.keys(query).length === 0) return urlStr;

  const u = new URL(urlStr, isAbsoluteUrl(urlStr) ? undefined : "http://localhost");
  for (const [k, v] of Object.entries(query)) {
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item === null || item === undefined) continue;
        u.searchParams.append(k, String(item));
      }
    } else {
      if (v === null || v === undefined) continue;
      u.searchParams.set(k, String(v));
    }
  }

  if (isAbsoluteUrl(urlStr)) return u.toString();
  return u.pathname + (u.search ? u.search : "");
};

const isFormData = (v: unknown): v is FormData =>
  typeof FormData !== "undefined" && v instanceof FormData;

const isBlob = (v: unknown): v is Blob =>
  typeof Blob !== "undefined" && v instanceof Blob;

const isArrayBuffer = (v: unknown): v is ArrayBuffer =>
  typeof ArrayBuffer !== "undefined" && v instanceof ArrayBuffer;

const normalizeBody = (body: unknown, headers: Record<string, string>) => {
  if (body === undefined || body === null) return undefined;

  if (typeof body === "string") {
    if (!headers["Content-Type"]) headers["Content-Type"] = "text/plain;charset=UTF-8";
    return body;
  }

  if (isFormData(body) || isBlob(body) || isArrayBuffer(body)) return body as BodyInit;

  headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  return JSON.stringify(body);
};

const parseResponse = async (res: Response) => {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return await res.text();
};

const getPayloadMessage = (payload: unknown) => {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as { message?: unknown };
  return typeof candidate.message === "string" ? candidate.message : null;
};

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const url = buildUrl(path, options.query);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (options.authToken) headers.Authorization = `Bearer ${options.authToken}`;

  const body = normalizeBody(options.body, headers);

  const res = await fetch(url, {
    method,
    headers,
    body: body as BodyInit | undefined,
    signal: options.signal,
    credentials: options.credentials ?? "include",
  });

  const payload = await parseResponse(res);

  if (!res.ok) {
    const message = getPayloadMessage(payload) ?? `Request failed (${res.status})`;
    throw new ApiError({ status: res.status, url, message, payload });
  }

  return payload as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T = unknown>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
