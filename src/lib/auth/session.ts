"use client";

import { useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const AUTH_USER_KEY = "authUser";
const AUTH_CHANGED_EVENT = "devtalk-auth-changed";

type GuestTokenResponse = {
  accessToken: string;
};

let pendingGuestToken: Promise<string> | null = null;

export const notifyAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const getAuthUser = () => {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

export const isLoggedIn = () => Boolean(getAuthUser());

export const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  notifyAuthChanged();
};

export const saveAuthSession = (accessToken: string, user: unknown) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  notifyAuthChanged();
};

export const ensureAccessToken = async () => {
  const existing = getAccessToken();
  if (existing) return existing;

  if (isLoggedIn()) {
    clearAuthSession();
    throw new Error("Login session expired");
  }

  if (!pendingGuestToken) {
    pendingGuestToken = fetchGuestToken().finally(() => {
      pendingGuestToken = null;
    });
  }

  return pendingGuestToken;
};

export const issueFreshGuestToken = async () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  const token = await ensureAccessToken();
  notifyAuthChanged();
  return token;
};

export const useAuthStatus = () => {
  const [state, setState] = useState({ ready: false, loggedIn: false });

  useEffect(() => {
    const sync = () => setState({ ready: true, loggedIn: isLoggedIn() && Boolean(getAccessToken()) });
    sync();

    window.addEventListener("storage", sync);
    window.addEventListener(AUTH_CHANGED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
    };
  }, []);

  return state;
};

async function fetchGuestToken() {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const res = await fetch(`${apiUrl}/auth/token`, {
    method: "POST",
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("게스트 토큰을 발급받지 못했습니다.");
  }

  const payload = (await res.json()) as GuestTokenResponse;
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  return payload.accessToken;
}
