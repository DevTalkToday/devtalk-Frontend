"use client";

import { useMemo, useState } from "react";
import { Input, Button } from "@/components/ui";
import MajorMultiSelect from "@/components/MajorMultiSelect";

type AuthProvider = "local" | "google" | "github";

type SignupPayload = {
  username: string;        // 아이디(로그인용)
  password: string;        // local일 때만 사용
  majors: string[];
  provider: AuthProvider;  // ✅ (3) 가입 방식
  consents: {              // ✅ (9) 약관 동의
    terms: boolean;
    privacy: boolean;
    marketing: boolean;
  };
};

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [majors, setMajors] = useState<string[]>([]);

  const [provider, setProvider] = useState<AuthProvider>("local");

  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });

  const allRequiredOk = consents.terms && consents.privacy;
  const passwordOk = provider !== "local" || (password.length > 0 && password === password2);

  const canSubmit = useMemo(() => {
    if (!username.trim()) return false;
    if (provider === "local" && !passwordOk) return false;
    if (majors.length === 0) return false;
    if (!allRequiredOk) return false;
    return true;
  }, [username, provider, passwordOk, majors.length, allRequiredOk]);

  const toggleAll = (checked: boolean) => {
    setConsents({ terms: checked, privacy: checked, marketing: checked });
  };

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <div className="text-2xl font-semibold">회원가입</div>

      {/* (3) 가입 방식: 지금은 local 기본, 나중에 소셜 붙이면 google/github로 넘어오게 */}
      <div className="flex gap-2">
        {(["google", "github"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setProvider(p)}
            className={[
              "h-9 rounded-full border px-3 text-sm transition",
              provider === p ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 bg-white text-gray-700",
            ].join(" ")}
          >
            {p.toUpperCase()}
          </button>
        ))}
      </div>

      {/* local 가입일 때만 비밀번호 입력 */}
      {provider === "local" && (
        <>
          <Input
            label="아이디"
            content="id"
            value={username}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="비밀번호"
            content="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="비밀번호 확인"
            content="password"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />

          {!passwordOk && (
            <div className="text-sm text-red-600">
              비밀번호가 비어있거나, 비밀번호 확인이 일치하지 않습니다.
            </div>
          )}
        </>
      )}

      {/* 전공 */}
      <div className="pt-2">
        <div className="mb-2 text-sm font-medium text-gray-800">전공(중복 선택 가능)</div>
        <MajorMultiSelect value={majors} onChange={setMajors} />
        <div className="mt-2 text-xs text-gray-500">선택됨: {majors.join(", ") || "없음"}</div>
      </div>

      {/* (9) 약관 동의 */}
      <div className="pt-2 space-y-2 rounded-lg border p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={consents.terms && consents.privacy && consents.marketing}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          전체 동의
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={consents.terms}
            onChange={(e) => setConsents((s) => ({ ...s, terms: e.target.checked }))}
          />
          (필수) 이용약관 동의
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={consents.privacy}
            onChange={(e) => setConsents((s) => ({ ...s, privacy: e.target.checked }))}
          />
          (필수) 개인정보 처리방침 동의
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={consents.marketing}
            onChange={(e) => setConsents((s) => ({ ...s, marketing: e.target.checked }))}
          />
          (선택) 마케팅 수신 동의
        </label>
      </div>

      <Button
        type="button"
        disabled={!canSubmit}
        className={[
          "mt-2 w-full rounded-lg px-4 py-3 text-white",
          canSubmit ? "bg-black" : "bg-gray-300 cursor-not-allowed",
        ].join(" ")}
        onClick={() => {
          const payload: SignupPayload = {
            username: username.trim(),
            password,
            majors,
            provider,
            consents,
          };
          console.log(payload);
        }}
      >
        다음
      </Button>
    </div>
  );
}
