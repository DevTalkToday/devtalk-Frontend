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

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

const isAbsoluteUrl = (value: string | undefined) => Boolean(value && ABSOLUTE_URL_PATTERN.test(value));

const resolveProxyBaseUrl = (request: NextRequest) => {
  const candidates = [
    process.env.API_PROXY_TARGET,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ]
    .map((value) => value?.trim() ?? "")
    .filter(isAbsoluteUrl)
    .map(trimTrailingSlashes);

  return candidates.find((candidate) => {
    try {
      const targetUrl = new URL(candidate);
      return !(targetUrl.origin === request.nextUrl.origin && targetUrl.pathname.startsWith("/api"));
    } catch {
      return false;
    }
  });
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
  const proxyBaseUrl = resolveProxyBaseUrl(request);
  if (!proxyBaseUrl) {
    return NextResponse.json(
      {
        message: "API proxy target is not configured",
      },
      { status: 500 },
    );
  }

  const { path = [] } = await context.params;
  const upstreamUrl = buildUpstreamUrl(proxyBaseUrl, path, request.nextUrl.search);
  const headers = copyRequestHeaders(request);
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: copyResponseHeaders(upstreamResponse),
    });
  } catch {
    return NextResponse.json(
      {
        message: "Could not connect to upstream API",
      },
      { status: 502 },
    );
  }
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
