"use client";

import { notFound } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { FetchGetAuthSilent } from "@/lib/api/fetch";
import { AUTH_CHANGED_EVENT } from "@/lib/auth/session";

type AdminCheckState = "checking" | "allowed" | "denied";

type AuthMeResponse = {
  user: {
    username?: string | null;
    email?: string | null;
    admin?: boolean;
  } | null;
};

const ADMIN_EMAIL = "s25002@gsm.hs.kr";

const isAdminUser = (user: AuthMeResponse["user"]) =>
  Boolean(
    user?.admin ||
      user?.username?.toLowerCase() === ADMIN_EMAIL ||
      user?.email?.toLowerCase() === ADMIN_EMAIL,
  );

export function AdminOnlyNotFound({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminCheckState>("checking");

  useEffect(() => {
    let alive = true;

    const checkAdmin = async () => {
      setState("checking");

      try {
        const response = (await FetchGetAuthSilent("/auth/me")) as AuthMeResponse;
        if (!alive) return;
        setState(isAdminUser(response.user) ? "allowed" : "denied");
      } catch {
        if (alive) setState("denied");
      }
    };

    void checkAdmin();
    window.addEventListener("storage", checkAdmin);
    window.addEventListener(AUTH_CHANGED_EVENT, checkAdmin);

    return () => {
      alive = false;
      window.removeEventListener("storage", checkAdmin);
      window.removeEventListener(AUTH_CHANGED_EVENT, checkAdmin);
    };
  }, []);

  if (state === "denied") {
    notFound();
  }

  if (state === "checking") {
    return <main className="min-h-screen" aria-hidden="true" />;
  }

  return <>{children}</>;
}
