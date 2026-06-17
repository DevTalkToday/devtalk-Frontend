"use client";

import { useEffect, useState } from "react";

const ACCESS_TOKEN_KEY = "accessToken";
const AUTH_USER_KEY = "authUser";
const LOGOUT_REDIRECT_KEY = "logoutRedirectingToHome";
export const AUTH_CHANGED_EVENT = "devtalk-auth-changed";

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

export const getOptionalUserAccessToken = () => {
  const token = getAccessToken();
  return isLoggedIn() && token ? token : null;
};

export const getRequiredAccessToken = () => {
  if (!isLoggedIn()) {
    throw new Error("Login is required");
  }

  const token = getAccessToken();
  if (!token) {
    clearAuthSession();
    throw new Error("Login session expired");
  }

  return token;
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  notifyAuthChanged();
};

export const saveAuthSession = (accessToken: string, user: unknown) => {
  sessionStorage.removeItem(LOGOUT_REDIRECT_KEY);
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  notifyAuthChanged();
};

export const beginLogoutRedirect = () => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LOGOUT_REDIRECT_KEY, "1");
  notifyAuthChanged();
};

export const finishLogoutRedirect = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LOGOUT_REDIRECT_KEY);
  notifyAuthChanged();
};

export const isLogoutRedirecting = () => {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(LOGOUT_REDIRECT_KEY) === "1";
};

export const useAuthStatus = () => {
  const [state, setState] = useState({ ready: false, loggedIn: false, redirectingAfterLogout: false });

  useEffect(() => {
    const sync = () =>
      setState({
        ready: true,
        loggedIn: isLoggedIn() && Boolean(getAccessToken()),
        redirectingAfterLogout: isLogoutRedirecting(),
      });
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
