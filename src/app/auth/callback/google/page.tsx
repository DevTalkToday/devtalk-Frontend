"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FetchPost } from "@/lib/api/fetch";
import { clearGoogleSession, readGoogleSession } from "@/lib/auth/google";
import { saveAuthSession } from "@/lib/auth/session";
import { startNavigationProgress } from "@/lib/navigation/progress";

type Result =
  | { ok: true; code: string; redirectUri: string; codeVerifier: string }
  | { ok: false };

type AuthResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
    username: string;
    nickname: string;
    email: string | null;
    profileCompleted: boolean;
  };
};

const googleCallbackRequests = new Map<string, Promise<AuthResponse>>();

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = useMemo(() => searchParams.get("code") ?? "", [searchParams]);
  const state = useMemo(() => searchParams.get("state") ?? "", [searchParams]);
  const error = useMemo(() => searchParams.get("error") ?? "", [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const validateCallback = (): Result => {
      if (error || !code || !state) {
        return { ok: false };
      }

      const session = readGoogleSession();
      if (!session) {
        return { ok: false };
      }

      if (session.state !== state) {
        clearGoogleSession();
        return { ok: false };
      }

      return { ok: true, code, redirectUri: session.redirectUri, codeVerifier: session.verifier };
    };

    const finishLogin = async () => {
      const result = validateCallback();
      if (!result.ok) {
        startNavigationProgress();
        router.replace("/login");
        return;
      }

      try {
        const requestKey = `${state}:${result.code}`;
        const request =
          googleCallbackRequests.get(requestKey) ??
          (FetchPost("/auth/google", {
            code: result.code,
            redirectUri: result.redirectUri,
            codeVerifier: result.codeVerifier,
          }) as Promise<AuthResponse>);

        googleCallbackRequests.set(requestKey, request);
        const auth = await request;

        if (cancelled) return;

        saveAuthSession(auth.accessToken, auth.user);
        clearGoogleSession();
        startNavigationProgress();
        router.replace(auth.user.profileCompleted ? "/" : "/auth/complete-profile");
      } catch {
        if (cancelled) return;

        startNavigationProgress();
        router.replace("/login");
      }
    };

    finishLogin();

    return () => {
      cancelled = true;
    };
  }, [code, state, error, router]);

  return null;
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
