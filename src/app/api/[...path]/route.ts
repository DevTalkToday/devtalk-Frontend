import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const RETRIABLE_UPSTREAM_STATUSES = new Set([404, 502, 503, 504]);
const UPSTREAM_FETCH_TIMEOUT_MS = 8000;

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

const isAbsoluteUrl = (value: string | undefined) => Boolean(value && ABSOLUTE_URL_PATTERN.test(value));

const unique = <T,>(values: T[]) => Array.from(new Set(values));

const isVercelRuntime = () => process.env.VERCEL === "1";
const VM_API_HOSTNAME = "ssh.gsmsv.site";
const BLOCKED_PROXY_HOSTNAMES = new Set(["backend", "devtalk.kr", "www.devtalk.kr"]);

const isVercelRequest = (request: NextRequest) =>
  isVercelRuntime() || request.nextUrl.hostname.endsWith(".vercel.app");

const isAllowedProxyCandidate = (candidate: string, request: NextRequest) => {
  try {
    const targetUrl = new URL(candidate);
    if (targetUrl.origin === request.nextUrl.origin && targetUrl.pathname.startsWith("/api")) {
      return false;
    }
    if (BLOCKED_PROXY_HOSTNAMES.has(targetUrl.hostname)) {
      return false;
    }
    return !isVercelRequest(request) || targetUrl.hostname === VM_API_HOSTNAME;
  } catch {
    return false;
  }
};

const getDefaultProxyCandidates = () => [
  `http://${VM_API_HOSTNAME}:25124/api`,
];

const resolveProxyBaseUrls = (request: NextRequest) => {
  const candidates = [
    process.env.API_PROXY_TARGET,
    ...getDefaultProxyCandidates(),
  ]
    .map((value) => value?.trim() ?? "")
    .filter(isAbsoluteUrl)
    .map(trimTrailingSlashes)
    .filter((candidate) => isAllowedProxyCandidate(candidate, request));

  return unique(candidates);
};

const buildUpstreamUrl = (baseUrl: string, pathSegments: string[], search: string) => {
  const upstreamUrl = new URL(`${trimTrailingSlashes(baseUrl)}/`);
  const targetPath = [upstreamUrl.pathname.replace(/\/+$/, ""), ...pathSegments]
    .filter(Boolean)
    .join("/");

  upstreamUrl.pathname = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  upstreamUrl.search = search;
  return upstreamUrl.toString();
};

const copyRequestHeaders = (request: NextRequest) => {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  return headers;
};

const copyResponseHeaders = (response: Response) => {
  const headers = new Headers();

  response.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  return headers;
};

const handle = async (request: NextRequest, context: RouteContext) => {
  const proxyBaseUrls = resolveProxyBaseUrls(request);
  if (proxyBaseUrls.length === 0) {
    return NextResponse.json(
      {
        message: "API proxy target is not configured",
      },
      { status: 500 },
    );
  }

  const { path = [] } = await context.params;
  const headers = copyRequestHeaders(request);
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const canRetryIdempotent = IDEMPOTENT_METHODS.has(request.method);
  let lastErrorResponse: NextResponse | null = null;

  for (const [index, proxyBaseUrl] of proxyBaseUrls.entries()) {
    const upstreamUrl = buildUpstreamUrl(proxyBaseUrl, path, request.nextUrl.search);
    const hasNextCandidate = index < proxyBaseUrls.length - 1;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_FETCH_TIMEOUT_MS);

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers,
        body,
        redirect: "manual",
        signal: controller.signal,
      });

      const proxiedResponse = new NextResponse(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: copyResponseHeaders(upstreamResponse),
      });

      const canRetryOnNotFound = hasNextCandidate && upstreamResponse.status === 404;
      const canRetryIdempotentError =
        canRetryIdempotent &&
        hasNextCandidate &&
        RETRIABLE_UPSTREAM_STATUSES.has(upstreamResponse.status);

      if (canRetryOnNotFound || canRetryIdempotentError) {
        lastErrorResponse = proxiedResponse;
        continue;
      }

      return proxiedResponse;
    } catch {
      if (hasNextCandidate) {
        continue;
      }

      return NextResponse.json(
        {
          message: "Upstream API timed out or could not be reached",
        },
        { status: 504 },
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return (
    lastErrorResponse ??
    NextResponse.json({ message: "Upstream API timed out or could not be reached" }, { status: 504 })
  );
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
