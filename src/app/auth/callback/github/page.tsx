"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearGithubSession, readGithubSession } from "@/lib/auth/github";
import { FetchPost } from "@/lib/api/fetch";
import { saveAuthSession } from "@/lib/auth/session";
import { startNavigationProgress } from "@/lib/navigation/progress";

type Result =
  | { ok: true; code: string; redirectUri: string; codeVerifier: string | null }
  | { ok: false; message: string };

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

const githubCallbackRequests = new Map<string, Promise<AuthResponse>>();

function GithubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = useMemo(() => searchParams.get("code") ?? "", [searchParams]);
  const state = useMemo(() => searchParams.get("state") ?? "", [searchParams]);
  const error = useMemo(() => searchParams.get("error") ?? "", [searchParams]);
  const errorDesc = useMemo(() => searchParams.get("error_description") ?? "", [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const validateCallback = (): Result => {
      if (error) {
        return { ok: false, message: `${error}${errorDesc ? `: ${errorDesc}` : ""}` };
      }

      if (!code || !state) {
        return { ok: false, message: "GitHub 로그인 응답이 올바르지 않습니다." };
      }

      const session = readGithubSession();
      if (!session) {
        return { ok: false, message: "GitHub 로그인 세션을 찾을 수 없습니다. 다시 로그인해 주세요." };
      }

      if (session.state !== state) {
        clearGithubSession();
        return { ok: false, message: "GitHub 로그인 검증에 실패했습니다. 다시 로그인해 주세요." };
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
          githubCallbackRequests.get(requestKey) ??
          (FetchPost("/auth/github", {
            code: result.code,
            redirectUri: result.redirectUri,
            codeVerifier: result.codeVerifier,
          }) as Promise<AuthResponse>);

        githubCallbackRequests.set(requestKey, request);
        const auth = await request;

        if (cancelled) return;

        saveAuthSession(auth.accessToken, auth.user);
        clearGithubSession();
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
  }, [code, state, error, errorDesc, router]);

  return null;
}

export default function GithubCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GithubCallbackContent />
    </Suspense>
  );
}
