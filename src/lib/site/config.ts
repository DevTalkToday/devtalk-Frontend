const DEFAULT_SITE_URL = "https://example.com";

const normalizeAbsoluteUrl = (value: string | null | undefined) => {
  const normalized = (value ?? "").trim().replace(/\/+$/, "");
  if (!normalized) return null;
  if (!/^https?:\/\//.test(normalized)) return null;
  return normalized;
};

const normalizeVercelUrl = (value: string | null | undefined) => {
  const normalized = (value ?? "").trim().replace(/\/+$/, "");
  if (!normalized) return null;
  return `https://${normalized}`;
};

export const getSiteUrl = () =>
  normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
  normalizeAbsoluteUrl(process.env.SITE_URL) ??
  normalizeVercelUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalizeVercelUrl(process.env.VERCEL_URL) ??
  DEFAULT_SITE_URL;

export const getServerApiBaseUrl = () =>
  normalizeAbsoluteUrl(process.env.API_PROXY_TARGET) ??
  normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_API_BASE_URL) ??
  normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_API_URL);

export const getGoogleSiteVerification = () => (process.env.GOOGLE_SITE_VERIFICATION ?? "").trim() || null;
