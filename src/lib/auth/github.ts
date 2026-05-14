import { createPKCE, randomString } from "./pkce";

const KEY = "oauth:github";

export const startGithubLogin = async () => {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "";
  if (!clientId) throw new Error("NEXT_PUBLIC_GITHUB_CLIENT_ID is missing");

  const { verifier, challenge } = await createPKCE();
  const state = randomString(32);
  const redirectUri = `${window.location.origin}/auth/callback/github`;

  sessionStorage.setItem(
    KEY,
    JSON.stringify({ state, verifier, redirectUri, createdAt: Date.now() })
  );

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  window.location.href = url.toString();
};

export const readGithubSession = () => {
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

export const clearGithubSession = () => {
  sessionStorage.removeItem(KEY);
};
