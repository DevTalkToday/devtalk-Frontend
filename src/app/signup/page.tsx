"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import MajorMultiSelect from "@/components/MajorMultiSelect";
import { PolicyConsentFields } from "@/components/legal/policy-consent-fields";
import { Button, Input } from "@/components/ui";
import { textFieldClassName } from "@/components/ui/input";
import { FetchPost } from "@/lib/api/fetch";
import { saveAuthSession } from "@/lib/auth/session";
import { showToast } from "@/lib/toast/events";

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

type EmailVerificationRequestResponse = {
  email: string;
  expiresInSeconds: number;
  emailSent: boolean;
  debugCode?: string | null;
};

type EmailVerificationConfirmResponse = {
  email: string;
  verified: boolean;
};

type Consents = {
  terms: boolean;
  privacy: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PLACEHOLDER = "\uBE44\uBC00\uBC88\uD638";
const PASSWORD_CONFIRM_PLACEHOLDER = "\uBE44\uBC00\uBC88\uD638 \uC7AC\uC785\uB825";
const PASSWORD_LENGTH_ERROR = "\uBE44\uBC00\uBC88\uD638\uB294 8\uAE00\uC790 \uC774\uC0C1 \uC785\uB825\uD574\uC8FC\uC138\uC694.";
const PASSWORD_MISMATCH_ERROR = "\uBE44\uBC00\uBC88\uD638 \uD655\uC778\uC774 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.";
const CUSTOM_MAJOR_BUTTON_LABEL = "\uAE30\uD0C0 \uC785\uB825";
const CUSTOM_MAJOR_PLACEHOLDER = "\uC9C1\uC811 \uC785\uB825";
const CUSTOM_MAJOR_HINT = "\uCD5C\uB300 40\uC790\uAE4C\uC9C0 \uC785\uB825\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
const CUSTOM_MAJOR_MAX_LENGTH = 40;

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [majors, setMajors] = useState<string[]>([]);
  const [customMajor, setCustomMajor] = useState("");
  const [showCustomMajorInput, setShowCustomMajorInput] = useState(false);
  const [consents, setConsents] = useState<Consents>({
    terms: false,
    privacy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isConfirmingCode, setIsConfirmingCode] = useState(false);
  const [verificationRequestedEmail, setVerificationRequestedEmail] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const normalizedEmail = email.trim();
  const normalizedRequestedEmail = verificationRequestedEmail.trim().toLowerCase();
  const normalizedVerifiedEmail = verifiedEmail.trim().toLowerCase();
  const normalizedCustomMajor = customMajor.trim();
  const fallbackNickname = normalizedEmail.split("@")[0]?.trim() || normalizedEmail;
  const emailOk = EMAIL_PATTERN.test(normalizedEmail);
  const emailMatchesRequested = normalizedEmail.toLowerCase() === normalizedRequestedEmail;
  const emailVerified = normalizedEmail.toLowerCase() === normalizedVerifiedEmail && normalizedVerifiedEmail.length > 0;
  const passwordMatches = password.length > 0 && password === passwordConfirm;
  const requiredConsentsChecked = consents.terms && consents.privacy;
  const customMajorSelected = showCustomMajorInput || normalizedCustomMajor.length > 0;
  const signupMajors = useMemo(() => {
    const seen = new Set<string>();
    const next: string[] = [];

    for (const major of [...majors, normalizedCustomMajor]) {
      const trimmed = major.trim();
      const key = trimmed.toLowerCase();
      if (!trimmed || seen.has(key)) continue;

      seen.add(key);
      next.push(trimmed);
    }

    return next;
  }, [majors, normalizedCustomMajor]);

  const canSubmit = useMemo(() => {
    return (
      emailOk &&
      emailVerified &&
      password.length >= 8 &&
      passwordMatches &&
      signupMajors.length > 0 &&
      requiredConsentsChecked
    );
  }, [emailOk, emailVerified, password.length, passwordMatches, signupMajors.length, requiredConsentsChecked]);

  const canConfirmCode =
    emailMatchesRequested &&
    verificationCode.trim().length === 6 &&
    !emailVerified &&
    !isConfirmingCode;

  useEffect(() => {
    if (!normalizedEmail) {
      setVerificationRequestedEmail("");
      setVerifiedEmail("");
      setVerificationCode("");
      setDebugCode(null);
      return;
    }

    const loweredEmail = normalizedEmail.toLowerCase();

    if (normalizedRequestedEmail && loweredEmail !== normalizedRequestedEmail) {
      setVerificationRequestedEmail("");
      setVerificationCode("");
      setDebugCode(null);
    }

    if (normalizedVerifiedEmail && loweredEmail !== normalizedVerifiedEmail) {
      setVerifiedEmail("");
    }
  }, [normalizedEmail, normalizedRequestedEmail, normalizedVerifiedEmail]);

  const updateConsent = (name: keyof Consents, checked: boolean) => {
    setConsents((current) => ({ ...current, [name]: checked }));
  };

  const toggleCustomMajorInput = () => {
    if (normalizedCustomMajor) {
      setShowCustomMajorInput(true);
      return;
    }

    setShowCustomMajorInput((current) => !current);
  };

  const requestVerificationCode = async () => {
    if (!emailOk || isRequestingCode) return;

    try {
      setIsRequestingCode(true);
      const response = (await FetchPost("/auth/email-verification/request", {
        email: normalizedEmail,
      })) as EmailVerificationRequestResponse;

      setVerificationRequestedEmail(response.email);
      setVerifiedEmail("");
      setVerificationCode(response.debugCode ?? "");
      setDebugCode(response.debugCode ?? null);

      showToast({
        title: "\uC778\uC99D\uBC88\uD638 \uBC1C\uAE09",
        message: response.debugCode
          ? `\uAC1C\uBC1C\uC6A9 \uC778\uC99D\uBC88\uD638 ${response.debugCode}\uAC00 \uBC1C\uAE09\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uD655\uC778 \uBC84\uD2BC\uAE4C\uC9C0 \uB20C\uB7EC\uC8FC\uC138\uC694.`
          : response.emailSent
            ? "\uC778\uC99D\uBC88\uD638\uB97C \uBA54\uC77C\uB85C \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4. \uBA54\uC77C\uD568\uACFC \uC2A4\uD338\uD568\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694."
            : "\uC778\uC99D\uBC88\uD638\uB97C \uBC1C\uAE09\uD588\uC2B5\uB2C8\uB2E4. \uD655\uC778 \uBC84\uD2BC\uC73C\uB85C \uC778\uC99D\uC744 \uC644\uB8CC\uD574\uC8FC\uC138\uC694.",
        tone: "success",
      });
    } catch {
      // Request helper shows a toast with a safe message.
    } finally {
      setIsRequestingCode(false);
    }
  };

  const confirmVerificationCode = async () => {
    if (!canConfirmCode) return;

    try {
      setIsConfirmingCode(true);
      const response = (await FetchPost("/auth/email-verification/confirm", {
        email: normalizedEmail,
        code: verificationCode.trim(),
      })) as EmailVerificationConfirmResponse;

      if (response.verified) {
        setVerifiedEmail(response.email);
        showToast({
          title: "\uC774\uBA54\uC77C \uC778\uC99D \uC644\uB8CC",
          message: "\uC774\uBA54\uC77C \uC778\uC99D\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
          tone: "success",
        });
      }
    } catch {
      // Request helper shows a toast with a safe message.
    } finally {
      setIsConfirmingCode(false);
    }
  };

  const submitSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const auth = (await FetchPost("/auth/signup", {
        username: normalizedEmail,
        password,
        nickname: nickname.trim() || fallbackNickname,
        majors: signupMajors,
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
            <h1 className="text-2xl font-semibold text-(--foreground)">{"\uD68C\uC6D0\uAC00\uC785"}</h1>
            <p className="mt-2 text-sm text-(--muted-strong)">{"Devtalk \uACC4\uC815\uC744 \uB9CC\uB4ED\uB2C8\uB2E4."}</p>
          </div>
          <Link className="text-sm font-semibold text-(--accent)" href="/login">
            {"\uB85C\uADF8\uC778으로 돌아가기"}
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={"\uC774\uBA54\uC77C"}
            content="name@example.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label={"\uB2C9\uB124\uC784"}
            content="닉네임"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            autoComplete="nickname"
          />
        </div>

        <section className="mt-5 rounded-[24px] border border-(--border) bg-(--surface-raised) p-4 sm:p-5">
          <p className="text-sm font-semibold text-(--foreground)">{"\uC778\uC99D\uBC88\uD638"}</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_148px] sm:items-center">
            <div className="relative">
              <input
                placeholder={"\u0036\uC790\uB9AC \uC22B\uC790"}
                inputMode="numeric"
                maxLength={6}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={!emailMatchesRequested || emailVerified}
                className={textFieldClassName({
                  className: "pr-32",
                })}
              />

              <Button
                type="button"
                size="sm"
                onClick={requestVerificationCode}
                disabled={!emailOk || isRequestingCode}
                className="absolute right-2 top-1/2 min-h-[40px] -translate-y-1/2 rounded-[16px] px-4 text-xs hover:!-translate-y-1/2 sm:min-w-[96px]"
              >
                {isRequestingCode
                  ? "\uC694\uCCAD \uC911.."
                  : emailMatchesRequested
                    ? "\uC7AC\uC694\uCCAD"
                    : "\uC694\uCCAD"}
              </Button>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={confirmVerificationCode}
              disabled={!canConfirmCode}
              className="min-h-[56px] rounded-[18px] px-5"
            >
              {isConfirmingCode
                ? "\uD655\uC778 \uC911.."
                : emailVerified
                  ? "\uC778\uC99D \uC644\uB8CC"
                  : "\uC778\uC99D \uD655\uC778"}
            </Button>
          </div>

          {(emailVerified || debugCode) ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {emailVerified ? (
                <span className="font-semibold text-(--accent)">{"\uC774\uBA54\uC77C \uC778\uC99D \uC644\uB8CC"}</span>
              ) : null}
              {debugCode ? (
                <span className="rounded-full border border-(--border) bg-(--surface) px-3 py-1 font-semibold text-(--accent)">
                  {`\uAC1C\uBC1C\uC6A9 \uCF54\uB4DC ${debugCode}`}
                </span>
              ) : null}
            </div>
          ) : null}
        </section>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label={"\uBE44\uBC00\uBC88\uD638"}
            content={"\u0038\uC790 \uC774\uC0C1"}
            placeholder={PASSWORD_PLACEHOLDER}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            label={"\uBE44\uBC00\uBC88\uD638 \uD655\uC778"}
            content={PASSWORD_CONFIRM_PLACEHOLDER}
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {password && password.length < 8 ? (
          <p className="mt-3 text-sm text-(--danger)">{PASSWORD_LENGTH_ERROR}</p>
        ) : null}

        {passwordConfirm && !passwordMatches ? (
          <p className="mt-3 text-sm text-(--danger)">{PASSWORD_MISMATCH_ERROR}</p>
        ) : null}

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-(--muted-strong)">{"\uC804\uACF5"}</p>
            <p className="text-xs text-(--muted)">{`\uC120\uD0DD ${signupMajors.length}`}</p>
          </div>

          <MajorMultiSelect
            value={majors}
            onChange={setMajors}
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
                hint={CUSTOM_MAJOR_HINT}
                value={customMajor}
                onChange={(event) => setCustomMajor(event.target.value.slice(0, CUSTOM_MAJOR_MAX_LENGTH))}
              />
            </div>
          ) : null}
        </section>

        <PolicyConsentFields value={consents} onChange={updateConsent} />

        <Button type="submit" variant="primary" fullWidth disabled={!canSubmit || isSubmitting} className="mt-6">
          {isSubmitting ? "\uAC00\uC785 \uC911.." : "\uAC00\uC785\uD558\uAE30"}
        </Button>
      </form>
    </main>
  );
}
