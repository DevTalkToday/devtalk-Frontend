import { createPKCE, hasSecurePkceSupport, randomString } from "./pkce";

const KEY = "oauth:google";

export const canUseGoogleLogin = () =>
  typeof window !== "undefined" && window.isSecureContext && hasSecurePkceSupport();

export const startGoogleLogin = async () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  if (!clientId) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing");
  if (!canUseGoogleLogin()) {
    throw new Error("Google 로그인은 HTTPS 환경에서만 사용할 수 있습니다.");
  }

  const { verifier, challenge } = await createPKCE();
  const state = randomString(32);
  const redirectUri =
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback/google`;

  sessionStorage.setItem(
    KEY,
    JSON.stringify({ state, verifier, redirectUri, createdAt: Date.now() })
  );

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");

  window.location.href = url.toString();
};

export const readGoogleSession = () => {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      state: string;
      verifier: string;
      redirectUri: string;
      createdAt: number;
    };
  } catch {
    return null;
  }
};

export const clearGoogleSession = () => {
  sessionStorage.removeItem(KEY);
};
