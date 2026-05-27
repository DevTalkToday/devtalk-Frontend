"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import MajorMultiSelect from "@/components/MajorMultiSelect";
import { PolicyConsentFields } from "@/components/legal/policy-consent-fields";
import { Button, Input, Textarea } from "@/components/ui";
import { FetchPostAuth } from "@/lib/api/fetch";
import { saveAuthSession } from "@/lib/auth/session";

type UserResponse = {
  id: number;
  username: string;
  nickname: string;
  email: string | null;
  description: string | null;
  profileCompleted: boolean;
};

export default function CompleteProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [description, setDescription] = useState("");
  const [majors, setMajors] = useState<string[]>([]);
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      nickname.trim().length > 0 &&
      password.length >= 8 &&
      password === passwordConfirm &&
      majors.length > 0 &&
      consents.terms &&
      consents.privacy
    );
  }, [nickname, password, passwordConfirm, majors.length, consents.terms, consents.privacy]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const user = (await FetchPostAuth("/auth/profile", {
        nickname: nickname.trim(),
        password,
        passwordConfirm,
        description: description.trim() || null,
        majors,
      })) as UserResponse;

      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) saveAuthSession(accessToken, user);
      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "프로필 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow)"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">계정 정보 입력</h1>
          <p className="mt-2 text-sm leading-6 text-(--muted-strong)">
            소셜 로그인 후 Devtalk에서 사용할 정보를 입력해 주세요.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="닉네임"
            content="표시될 닉네임"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            required
          />
          <Input
            label="비밀번호"
            content="8자 이상"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Input
            label="비밀번호 확인"
            content="비밀번호를 다시 입력"
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            required
          />
        </div>

        <div className="mt-4">
          <Textarea
            label="설명"
            content="간단한 자기소개를 입력해 주세요"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={500}
          />
        </div>

        {passwordConfirm && password !== passwordConfirm ? (
          <p className="mt-3 text-sm text-(--danger)">비밀번호 확인이 일치하지 않습니다.</p>
        ) : null}

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-(--muted-strong)">전공</p>
            <p className="text-xs text-(--muted)">선택 {majors.length}</p>
          </div>
          <MajorMultiSelect value={majors} onChange={setMajors} />
        </section>

        <PolicyConsentFields
          value={consents}
          onChange={(name, checked) => setConsents((current) => ({ ...current, [name]: checked }))}
        />

        {message ? <p className="mt-4 text-sm text-(--danger)">{message}</p> : null}

        <Button type="submit" variant="primary" fullWidth disabled={!canSubmit || isSubmitting} className="mt-6">
          {isSubmitting ? "저장 중" : "완료"}
        </Button>
      </form>
    </main>
  );
}
