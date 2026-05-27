"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { startGithubLogin } from "@/lib/auth/github";
import { startGoogleLogin } from "@/lib/auth/google";
import { Button, Input } from "@/components/ui";
import { FetchPost } from "@/lib/api/fetch";
import { saveAuthSession } from "@/lib/auth/session";

type AuthResponse = {
  accessToken: string;
  user: unknown;
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !isSubmitting;

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      setMessage("");
      const auth = (await FetchPost("/auth/login", {
        username: username.trim(),
        password,
      })) as AuthResponse;

      saveAuthSession(auth.accessToken, auth.user);
      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl items-center px-5 py-10">
      <section className="grid overflow-hidden rounded-[28px] border border-(--border) bg-(--surface) shadow-(--shadow) backdrop-blur-[18px] lg:grid-cols-[0.92fr_1fr]">
        <div className="hidden border-r border-(--border) bg-[#dceaff] p-10 [background-image:linear-gradient(135deg,rgba(91,124,245,0.13)_12.5%,transparent_12.5%,transparent_50%,rgba(91,124,245,0.13)_50%,rgba(91,124,245,0.13)_62.5%,transparent_62.5%,transparent)] [background-size:36px_36px] lg:flex lg:flex-col lg:justify-between">
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3 text-lg font-bold text-(--foreground)">
              <Image
                src="/DevTalk.svg"
                alt="DevTalk"
                width={72}
                height={72}
                priority
                className="size-[72px] rounded-full object-contain"
              />
              DevTalk
            </Link>
          </div>

          <div className="min-h-[540px] overflow-hidden rounded-[24px] border border-(--border) bg-white/10" />
        </div>

        <form onSubmit={submitLogin} className="p-6 sm:p-8 lg:p-12">
          <div className="mb-8">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-(--accent) lg:hidden">
              <Image
                src="/DevTalk.svg"
                alt="DevTalk"
                width={32}
                height={32}
                priority
                className="size-8 rounded-full object-contain"
              />
              DevTalk
            </Link>
            <p className="text-sm font-semibold text-(--accent)">Welcome back</p>
            <h2 className="mt-3 text-3xl font-semibold text-(--foreground)">로그인</h2>
            <p className="mt-3 text-sm leading-6 text-(--muted-strong)">
              사용 중인 계정으로 로그인하거나 소셜 계정으로 바로 시작하세요.
            </p>
          </div>

          <div className="grid gap-4">
            <Input
              id="username"
              label="아이디"
              content="아이디를 입력하세요"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />

            <Input
              id="password"
              label="비밀번호"
              content="비밀번호를 입력하세요"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {message ? (
            <p className="mt-4 rounded-[16px] border border-(--danger) bg-(--surface-soft) px-4 py-3 text-sm text-(--danger)">
              {message}
            </p>
          ) : null}

          <Button type="submit" variant="primary" fullWidth disabled={!canSubmit} className="mt-6">
            {isSubmitting ? "로그인 중..." : "로그인"}
          </Button>

          <div className="my-7 flex items-center gap-3 text-xs font-semibold text-(--muted)">
            <span className="h-px flex-1 bg-(--border)" />
            <span>또는</span>
            <span className="h-px flex-1 bg-(--border)" />
          </div>

          <div className="grid gap-3">
            <Button type="button" fullWidth onClick={() => startGoogleLogin()} className="justify-start px-5">
              <Image src="/google.svg" alt="" width={20} height={20} className="size-5" />
              <span className="flex-1 text-center">Google로 계속하기</span>
            </Button>

            <Button type="button" fullWidth onClick={() => startGithubLogin()} className="justify-start px-5">
              <Image src="/github.svg" alt="" width={20} height={20} className="theme-icon size-5" />
              <span className="flex-1 text-center">GitHub로 계속하기</span>
            </Button>
          </div>

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
            <span aria-hidden="true">·</span>
            <Link href="/legal/privacy" className="transition hover:text-(--foreground)">
              개인정보 처리방침
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
