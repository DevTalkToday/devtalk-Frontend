"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import MajorMultiSelect from "@/components/MajorMultiSelect";
import { PolicyConsentFields } from "@/components/legal/policy-consent-fields";
import { Button, Input, Textarea } from "@/components/ui";
import { FetchPostAuth } from "@/lib/api/fetch";
import { saveAuthSession } from "@/lib/auth/session";
import { isKnownMajorValue, normalizeMajorValues } from "@/lib/majors/normalize";

type UserResponse = {
  id: number;
  username: string;
  nickname: string;
  email: string | null;
  description: string | null;
  profileCompleted: boolean;
};

const CUSTOM_MAJOR_BUTTON_LABEL = "기타 입력";
const CUSTOM_MAJOR_PLACEHOLDER = "직접 입력";
const CUSTOM_MAJOR_MAX_LENGTH = 40;
const MAX_MAJOR_COUNT = 8;

export default function CompleteProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [description, setDescription] = useState("");
  const [majors, setMajors] = useState<string[]>([]);
  const [customMajor, setCustomMajor] = useState("");
  const [showCustomMajorInput, setShowCustomMajorInput] = useState(false);
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedCustomMajor = customMajor.trim();
  const customMajorSelected = showCustomMajorInput || normalizedCustomMajor.length > 0;
  const selectedMajors = useMemo(
    () => normalizeMajorValues([...majors, normalizedCustomMajor], MAX_MAJOR_COUNT),
    [majors, normalizedCustomMajor],
  );

  const canSubmit = useMemo(() => {
    return (
      nickname.trim().length > 0 &&
      password.length >= 8 &&
      password === passwordConfirm &&
      selectedMajors.length > 0 &&
      consents.terms &&
      consents.privacy
    );
  }, [nickname, password, passwordConfirm, selectedMajors.length, consents.terms, consents.privacy]);

  const toggleCustomMajorInput = () => {
    if (normalizedCustomMajor) {
      setShowCustomMajorInput(true);
      return;
    }

    setShowCustomMajorInput((current) => !current);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const user = (await FetchPostAuth("/auth/profile", {
        nickname: nickname.trim(),
        password,
        passwordConfirm,
        description: description.trim() || null,
        majors: selectedMajors,
      })) as UserResponse;

      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) saveAuthSession(accessToken, user);
      router.replace("/");
    } catch {
      // Request helper shows a toast with a safe message.
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
            <p className="text-xs text-(--muted)">선택 {selectedMajors.length}</p>
          </div>

          <MajorMultiSelect
            value={majors}
            onChange={(next) => setMajors(next.filter(isKnownMajorValue))}
            maxSelect={MAX_MAJOR_COUNT}
            valueMode="label"
            afterOptions={(
              <button
                type="button"
                aria-pressed={customMajorSelected}
                onClick={toggleCustomMajorInput}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-[0.88rem] font-medium transition duration-150",
                  customMajorSelected
                    ? "border-(--accent) bg-(--surface-soft) text-(--foreground)"
                    : "border-(--border) bg-(--surface-raised) text-(--muted-strong) hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface-soft) hover:text-(--foreground)",
                ].join(" ")}
              >
                {CUSTOM_MAJOR_BUTTON_LABEL}
              </button>
            )}
          />

          {customMajorSelected ? (
            <div className="mt-3">
              <Input
                content={CUSTOM_MAJOR_PLACEHOLDER}
                value={customMajor}
                onChange={(event) => setCustomMajor(event.target.value.slice(0, CUSTOM_MAJOR_MAX_LENGTH))}
              />
            </div>
          ) : null}
        </section>

        <PolicyConsentFields
          value={consents}
          onChange={(name, checked) => setConsents((current) => ({ ...current, [name]: checked }))}
        />

        <Button type="submit" variant="primary" fullWidth disabled={!canSubmit || isSubmitting} className="mt-6">
          {isSubmitting ? "저장 중..." : "완료"}
        </Button>
      </form>
    </main>
  );
}
