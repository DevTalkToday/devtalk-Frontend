"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Button, Input } from "@/components/ui";
import { FetchPost } from "@/lib/api/fetch";
import { saveAuthSession } from "@/lib/auth/session";
import { startGithubLogin } from "@/lib/auth/github";
import { canUseGoogleLogin, startGoogleLogin } from "@/lib/auth/google";
import { startNavigationProgress } from "@/lib/navigation/progress";
import { showErrorToast } from "@/lib/toast/events";

type AuthResponse = {
  accessToken: string;
  user: unknown;
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoginEnabled, setGoogleLoginEnabled] = useState(false);
  const hasGoogleConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  const hasGoogleLogin = hasGoogleConfigured && googleLoginEnabled;
  const hasGithubLogin = Boolean(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID);
  const hasSocialLogin = hasGoogleLogin || hasGithubLogin;
  const showGoogleHttpsHint = hasGoogleConfigured && !googleLoginEnabled;

  const canSubmit = username.trim().length > 0 && password.length > 0 && !isSubmitting;

  useEffect(() => {
    setGoogleLoginEnabled(canUseGoogleLogin());
  }, []);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      const auth = (await FetchPost("/auth/login", {
        username: username.trim(),
        password,
      })) as AuthResponse;

      saveAuthSession(auth.accessToken, auth.user);
      startNavigationProgress();
      router.replace("/");
    } catch {
      // Request helper shows a toast with a safe message.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await startGoogleLogin();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Google 로그인을 시작할 수 없습니다.");
    }
  };

  const handleGithubLogin = async () => {
    try {
      await startGithubLogin();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "GitHub 로그인을 시작할 수 없습니다.");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-[540px] rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px] sm:p-8 lg:p-10">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3 text-lg font-bold text-(--foreground)">
            <Image
              src="/DevTalk.svg"
              alt="DevTalk"
              width={56}
              height={56}
              priority
              className="size-14 rounded-full object-contain"
            />
            DevTalk
          </Link>
          <h1 className="mt-6 text-3xl font-semibold text-(--foreground)">로그인</h1>
          <p className="mt-3 text-sm leading-6 text-(--muted-strong)">
            기존 계정으로 로그인하거나 소셜 계정으로 계속해 주세요.
          </p>
        </div>

        <form onSubmit={submitLogin}>
          <div className="grid gap-4">
            <Input
              id="username"
              label="이메일"
              content="이메일을 입력해 주세요"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />

            <Input
              id="password"
              label="비밀번호"
              content="비밀번호를 입력해 주세요"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" variant="primary" fullWidth disabled={!canSubmit} className="mt-6">
            {isSubmitting ? "로그인 중..." : "로그인"}
          </Button>

          {hasSocialLogin ? (
            <>
              <div className="my-7 flex items-center gap-3 text-xs font-semibold text-(--muted)">
                <span className="h-px flex-1 bg-(--border)" />
                <span>또는</span>
                <span className="h-px flex-1 bg-(--border)" />
              </div>

              <div className="grid gap-3">
                {hasGoogleLogin ? (
                  <Button type="button" fullWidth onClick={handleGoogleLogin} className="justify-start px-5">
                    <Image src="/google.svg" alt="" width={20} height={20} className="size-5" />
                    <span className="flex-1 text-center">Google로 계속하기</span>
                  </Button>
                ) : null}

                {hasGithubLogin ? (
                  <Button type="button" fullWidth onClick={handleGithubLogin} className="justify-start px-5">
                    <Image src="/github.svg" alt="" width={20} height={20} className="theme-icon size-5" />
                    <span className="flex-1 text-center">GitHub로 계속하기</span>
                  </Button>
                ) : null}
              </div>

              {showGoogleHttpsHint ? (
                <p className="mt-3 text-xs leading-5 text-(--muted-strong)">
                  Google 로그인은 HTTPS가 적용된 배포 환경에서만 표시됩니다.
                </p>
              ) : null}
            </>
          ) : null}
        </form>

        <p className="mt-8 text-center text-sm text-(--muted-strong)">
          계정이 없나요?{" "}
          <Link href="/signup" className="font-semibold text-(--accent)">
            회원가입
          </Link>
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-(--muted-strong)">
          <Link href="/legal/terms" className="transition hover:text-(--foreground)">
            이용약관
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/legal/privacy" className="transition hover:text-(--foreground)">
            개인정보처리방침
          </Link>
        </div>
      </section>
    </main>
  );
}
