"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import MajorMultiSelect from "@/components/MajorMultiSelect";
import { PolicyConsentFields } from "@/components/legal/policy-consent-fields";
import { Button, Input } from "@/components/ui";
import { FetchPost } from "@/lib/api/fetch";
import { saveAuthSession } from "@/lib/auth/session";

type AuthResponse = {
  accessToken: string;
  user: {
    id: number;
    username: string;
    nickname: string;
    email: string | null;
    profileCompleted: boolean;
  };
};

type Consents = {
  terms: boolean;
  privacy: boolean;
};

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [majors, setMajors] = useState<string[]>([]);
  const [consents, setConsents] = useState<Consents>({
    terms: false,
    privacy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordMatches = password.length > 0 && password === passwordConfirm;
  const requiredConsentsChecked = consents.terms && consents.privacy;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const canSubmit = useMemo(() => {
    return (
      emailOk &&
      password.length >= 8 &&
      passwordMatches &&
      majors.length > 0 &&
      requiredConsentsChecked
    );
  }, [emailOk, password.length, passwordMatches, majors.length, requiredConsentsChecked]);

  const updateConsent = (name: keyof Consents, checked: boolean) => {
    setConsents((current) => ({ ...current, [name]: checked }));
  };

  const submitSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const normalizedEmail = email.trim();
      const auth = (await FetchPost("/auth/signup", {
        username: normalizedEmail,
        password,
        nickname: nickname.trim() || normalizedEmail,
        majors,
      })) as AuthResponse;

      saveAuthSession(auth.accessToken, auth.user);
      router.replace("/");
    } catch {
      // Request helper shows a toast with a safe message.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-10">
      <form
        onSubmit={submitSignup}
        className="w-full rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow)"
      >
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-(--foreground)">회원가입</h1>
            <p className="mt-2 text-sm text-(--muted-strong)">Devtalk 계정을 만듭니다.</p>
          </div>
          <Link className="text-sm font-semibold text-(--accent)" href="/login">
            로그인
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="이메일"
            content="name@example.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="닉네임"
            content="비우면 이메일로 설정"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            autoComplete="nickname"
          />
          <Input
            label="비밀번호"
            content="8자 이상"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            label="비밀번호 확인"
            content="비밀번호 재입력"
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {passwordConfirm && !passwordMatches ? (
          <p className="mt-3 text-sm text-(--danger)">비밀번호 확인이 일치하지 않습니다.</p>
        ) : null}

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-(--muted-strong)">전공</p>
            <p className="text-xs text-(--muted)">선택 {majors.length}</p>
          </div>
          <MajorMultiSelect value={majors} onChange={setMajors} />
        </section>

        <PolicyConsentFields value={consents} onChange={updateConsent} />

        <Button type="submit" variant="primary" fullWidth disabled={!canSubmit || isSubmitting} className="mt-6">
          {isSubmitting ? "가입 중" : "가입하기"}
        </Button>
      </form>
    </main>
  );
}
