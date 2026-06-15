"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RequireLogin } from "@/components/auth/require-login";
import { AppShell } from "@/components/devtalk/app-shell";
import { ConstructionState } from "@/components/devtalk/construction-state";
import { Button, Input } from "@/components/ui";
import { FetchDeleteAuth, FetchGetAuth, FetchPatchAuth } from "@/lib/api/fetch";
import { getAuthUser } from "@/lib/auth/session";
import { showToast } from "@/lib/toast/events";

type SettingsTab = "account" | "notifications" | "achievements" | "reports" | "users";
type NotificationKind =
  | "POST_COMMENT"
  | "ADMIN_NOTICE"
  | "REPORT_SUBMITTED"
  | "REPORT_REVIEWED"
  | "COMMENT_ACCEPTED"
  | "FOLLOWING_POST";
type ConfigurableNotificationKind = Exclude<NotificationKind, "ADMIN_NOTICE">;

type AuthUser = {
  id?: number | string;
  username?: string | null;
  email?: string | null;
  admin?: boolean;
};

type ProfileMeResponse = {
  user: AuthUser | null;
};

type NotificationPreference = {
  type: ConfigurableNotificationKind;
  enabled: boolean;
};

type NotificationPreferenceResponse = {
  preferences: NotificationPreference[];
};

type ReportItem = {
  id: number;
  targetType: "post" | "comment" | "profile";
  targetId: string;
  targetLabel: string;
  targetUrl: string;
  subject: string;
  content: string;
  reporterLabel: string | null;
  createdAt: string;
};

type AdminUser = {
  id: number;
  username: string;
  nickname: string;
  email: string | null;
  profileCompleted: boolean;
  admin: boolean;
  majors: string[];
  postCount: number;
  commentCount: number;
  createdAt: string;
};

const ADMIN_EMAIL = "s25002@gsm.hs.kr";

const tabs: Array<{ id: SettingsTab; label: string; adminOnly?: boolean }> = [
  { id: "account", label: "계정 설정" },
  { id: "notifications", label: "알림 설정" },
  { id: "achievements", label: "업적" },
  { id: "reports", label: "신고 관리", adminOnly: true },
  { id: "users", label: "유저 관리", adminOnly: true },
];

const notificationOptions: Array<{
  type: ConfigurableNotificationKind;
  label: string;
  description: string;
}> = [
  {
    type: "POST_COMMENT",
    label: "댓글 알림",
    description: "내 게시글에 새 댓글이 달렸을 때 받습니다.",
  },
  {
    type: "COMMENT_ACCEPTED",
    label: "댓글 채택 알림",
    description: "내 댓글이 답변으로 채택되었을 때 받습니다.",
  },
  {
    type: "REPORT_SUBMITTED",
    label: "신고 접수 알림",
    description: "신고가 정상적으로 접수되었을 때 받습니다.",
  },
  {
    type: "REPORT_REVIEWED",
    label: "신고 처리 알림",
    description: "신고 처리 상태가 변경되었을 때 받습니다.",
  },
  {
    type: "FOLLOWING_POST",
    label: "팔로우 게시글 알림",
    description: "팔로우한 사용자가 새 게시글을 등록했을 때 받습니다.",
  },
];

const titleByTab: Record<SettingsTab, string> = {
  account: "계정 설정",
  notifications: "알림 설정",
  achievements: "업적",
  reports: "신고 관리",
  users: "유저 관리",
};

const summaryByTab: Record<SettingsTab, string> = {
  account: "로그인에 사용하는 비밀번호를 변경합니다.",
  notifications: "공지 외 알림 종류별 수신 여부를 조정합니다.",
  achievements: "업적 달성 시 프로필에서 꾸밀 수 있는 스티커를 획득합니다.",
  reports: "접수된 신고 내용을 확인합니다.",
  users: "가입 유저를 확인하고 필요한 경우 삭제합니다.",
};

const targetTypeLabel: Record<ReportItem["targetType"], string> = {
  post: "게시글",
  comment: "댓글",
  profile: "프로필",
};

const asAuthUser = (value: unknown): AuthUser | null => {
  if (!value || typeof value !== "object") return null;
  return value as AuthUser;
};

const isAdmin = (user: AuthUser | null | undefined) =>
  Boolean(
    user?.admin ||
      user?.username?.toLowerCase() === ADMIN_EMAIL ||
      user?.email?.toLowerCase() === ADMIN_EMAIL,
  );

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getSafeNavigationHref = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized || normalized.startsWith("//")) return null;
  if (normalized.startsWith("/")) return normalized;

  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

function ToggleSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-8 w-14 shrink-0 rounded-full border transition duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-(--accent) bg-(--accent)" : "border-(--border) bg-(--surface-soft)",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 size-6 rounded-full bg-white shadow-sm transition duration-150",
          checked ? "left-7" : "left-1",
        ].join(" ")}
      />
    </button>
  );
}

function AccountSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);

  const passwordsMatch = newPassword.length > 0 && newPassword === newPasswordConfirm;
  const canSubmit = currentPassword.length > 0 && newPassword.length >= 8 && passwordsMatch && !saving;

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setChanged(false);
    try {
      await FetchPatchAuth("/settings/password", {
        currentPassword,
        newPassword,
        newPasswordConfirm,
      });
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setChanged(true);
      showToast({ title: "저장 완료", message: "비밀번호가 변경되었습니다.", tone: "success" });
    } catch {
      // Request helper shows a toast with a safe message.
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submitPassword} className="grid max-w-2xl gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="현재 비밀번호"
          content="현재 비밀번호"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
          fieldClassName="sm:col-span-2"
        />
        <Input
          label="새 비밀번호"
          content="8자 이상"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        <Input
          label="새 비밀번호 확인"
          content="새 비밀번호 재입력"
          type="password"
          value={newPasswordConfirm}
          onChange={(event) => setNewPasswordConfirm(event.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      {newPasswordConfirm && !passwordsMatch ? (
        <p className="text-sm text-(--danger)">새 비밀번호 확인이 일치하지 않습니다.</p>
      ) : null}
      {changed ? <p className="text-sm font-semibold text-(--accent)">비밀번호가 변경되었습니다.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={!canSubmit}>
          {saving ? "저장 중" : "비밀번호 변경"}
        </Button>
      </div>
    </form>
  );
}

function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [busyType, setBusyType] = useState<ConfigurableNotificationKind | null>(null);

  const preferencesQuery = useQuery({
    queryKey: ["settings", "notifications"],
    queryFn: () => FetchGetAuth("/settings/notifications") as Promise<NotificationPreferenceResponse>,
    retry: false,
  });

  useEffect(() => {
    if (preferencesQuery.data) setPreferences(preferencesQuery.data.preferences);
    if (preferencesQuery.isError) setPreferences([]);
  }, [preferencesQuery.data, preferencesQuery.isError]);

  const loading = preferencesQuery.isLoading && preferences.length === 0;

  const orderedPreferences = useMemo(
    () =>
      notificationOptions.map((option) => ({
        ...option,
        enabled: preferences.find((preference) => preference.type === option.type)?.enabled ?? true,
      })),
    [preferences],
  );

  const togglePreference = async (type: ConfigurableNotificationKind, enabled: boolean) => {
    const previousPreferences = preferences;
    setBusyType(type);
    setPreferences((current) =>
      current.map((preference) => (preference.type === type ? { ...preference, enabled } : preference)),
    );

    try {
      const data = (await FetchPatchAuth("/settings/notifications", {
        preferences: {
          [type]: enabled,
        },
      })) as NotificationPreferenceResponse;
      setPreferences(data.preferences);
    } catch {
      setPreferences(previousPreferences);
    } finally {
      setBusyType(null);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="border border-(--border) bg-(--surface-soft) p-4 text-sm leading-6 text-(--muted-strong)">
        공지 알림은 항상 전달됩니다.
      </div>

      <div className="grid gap-3">
        {loading ? (
          <div className="border border-(--border) bg-(--surface-raised) p-5 text-sm text-(--muted-strong)">
            알림 설정을 불러오는 중입니다.
          </div>
        ) : null}

        {!loading
          ? orderedPreferences.map((preference) => (
              <div
                key={preference.type}
                className="grid gap-4 border border-(--border) bg-(--surface-raised) p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold">{preference.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-(--muted-strong)">{preference.description}</p>
                </div>
                <ToggleSwitch
                  checked={preference.enabled}
                  disabled={busyType === preference.type}
                  label={`${preference.label} ${preference.enabled ? "끄기" : "켜기"}`}
                  onChange={(enabled) => togglePreference(preference.type, enabled)}
                />
              </div>
            ))
          : null}
      </div>
    </div>
  );
}

function ReportManagement() {
  const reportsQuery = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => FetchGetAuth("/reports?limit=200") as Promise<ReportItem[]>,
    retry: false,
  });

  const reports = useMemo(
    () =>
      [...(reportsQuery.data ?? [])].sort((left, right) => {
        const createdDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        return createdDiff || right.id - left.id;
      }),
    [reportsQuery.data]
  );

  if (reportsQuery.isLoading) {
    return <p className="text-sm text-(--muted-strong)">신고 목록을 불러오는 중입니다.</p>;
  }

  if (reportsQuery.isError) {
    return <p className="text-sm font-semibold text-(--danger)">신고 목록을 불러오지 못했습니다.</p>;
  }

  return (
    <div className="grid gap-3">
      {reports.length === 0 ? (
        <div className="border border-(--border) bg-(--surface-raised) p-5 text-sm text-(--muted-strong)">
          접수된 신고가 없습니다.
        </div>
      ) : null}

      {reports.map((report) => (
        <article key={report.id} className="grid gap-3 border border-(--border) bg-(--surface-raised) p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--muted-strong)">
                  {targetTypeLabel[report.targetType] ?? report.targetType}
                </span>
                <span className="text-xs font-semibold text-(--muted-strong)">{formatDateTime(report.createdAt)}</span>
              </div>
              <h3 className="mt-2 break-words text-lg font-semibold">{report.subject}</h3>
              <p className="mt-1 break-words text-sm text-(--muted-strong)">
                대상: {report.targetLabel || report.targetId}
              </p>
            </div>
            {getSafeNavigationHref(report.targetUrl) ? (
              <a
                href={getSafeNavigationHref(report.targetUrl) ?? undefined}
                className="text-sm font-semibold text-(--accent) transition hover:underline"
                target={
                  getSafeNavigationHref(report.targetUrl)?.startsWith("http://") ||
                  getSafeNavigationHref(report.targetUrl)?.startsWith("https://")
                    ? "_blank"
                    : undefined
                }
                rel={
                  getSafeNavigationHref(report.targetUrl)?.startsWith("http://") ||
                  getSafeNavigationHref(report.targetUrl)?.startsWith("https://")
                    ? "noreferrer noopener"
                    : undefined
                }
              >
                대상 열기
              </a>
            ) : null}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7 text-(--foreground)">{report.content}</p>
          <p className="text-xs text-(--muted-strong)">신고자: {report.reporterLabel || "익명"}</p>
        </article>
      ))}
    </div>
  );
}

function UserManagement() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => FetchGetAuth("/admin/users") as Promise<AdminUser[]>,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => FetchDeleteAuth(`/admin/users/${userId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showToast({ title: "삭제 완료", message: "유저가 삭제되었습니다.", tone: "success" });
    },
  });

  const removeUser = (user: AdminUser) => {
    if (user.admin || deleteMutation.isPending) return;
    if (!window.confirm(`${user.nickname || user.username} 유저를 삭제할까요? 작성한 게시글, 댓글, 메시지가 함께 정리됩니다.`)) return;
    deleteMutation.mutate(user.id);
  };

  const users = usersQuery.data ?? [];

  if (usersQuery.isLoading) {
    return <p className="text-sm text-(--muted-strong)">유저 목록을 불러오는 중입니다.</p>;
  }

  if (usersQuery.isError) {
    return <p className="text-sm font-semibold text-(--danger)">유저 목록을 불러오지 못했습니다.</p>;
  }

  return (
    <div className="grid gap-3">
      {users.map((user) => {
        const deleting = deleteMutation.isPending && deleteMutation.variables === user.id;

        return (
          <article
            key={user.id}
            className="grid gap-4 border border-(--border) bg-(--surface-raised) p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words font-semibold">{user.nickname || user.username}</h3>
                {user.admin ? (
                  <span className="rounded-full border border-(--accent) bg-(--accent-soft) px-3 py-1 text-xs font-semibold text-(--accent)">
                    관리자
                  </span>
                ) : null}
                {!user.profileCompleted ? (
                  <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--muted-strong)">
                    프로필 미완료
                  </span>
                ) : null}
              </div>
              <p className="mt-1 break-words text-sm text-(--muted-strong)">
                {user.email || user.username} · 게시글 {user.postCount}개 · 댓글 {user.commentCount}개 · 가입 {formatDateTime(user.createdAt)}
              </p>
              {user.majors.length ? (
                <p className="mt-1 break-words text-xs text-(--muted-strong)">전공/관심: {user.majors.join(", ")}</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={user.admin || deleting || deleteMutation.isPending}
              onClick={() => removeUser(user)}
            >
              {deleting ? "삭제 중" : "유저 삭제"}
            </Button>
          </article>
        );
      })}
    </div>
  );
}

function AchievementSettings() {
  return <ConstructionState fullPage={false} message="개발 중입니다." />;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const localUser = asAuthUser(getAuthUser());
  const meQuery = useQuery({
    queryKey: ["settings", "me"],
    queryFn: () => FetchGetAuth("/profile/me") as Promise<ProfileMeResponse>,
    retry: false,
  });
  const currentUser = meQuery.data?.user ?? localUser;
  const admin = isAdmin(currentUser);
  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || admin);
  const effectiveTab: SettingsTab = !admin && (activeTab === "reports" || activeTab === "users") ? "account" : activeTab;

  const renderContent = () => {
    if (effectiveTab === "account") return <AccountSettings />;
    if (effectiveTab === "notifications") return <NotificationSettings />;
    if (effectiveTab === "achievements") return <AchievementSettings />;
    if (effectiveTab === "reports" && admin) return <ReportManagement />;
    if (effectiveTab === "users" && admin) return <UserManagement />;
    return <AccountSettings />;
  };

  return (
    <RequireLogin>
      <AppShell showPageHeader={false}>
        <section className="rounded-[28px] border border-(--border) bg-(--surface) p-5 shadow-(--shadow) backdrop-blur-[18px]">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="rounded-[24px] border border-(--border) bg-(--surface-raised) p-4 shadow-[0_18px_50px_rgba(51,94,180,0.08)]">
              <h1 className="px-3 pb-4 text-3xl font-semibold">설정</h1>
              <div className="grid gap-3">
                {visibleTabs.map((tab) => {
                  const selected = tab.id === effectiveTab;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={[
                        "flex h-[3.25rem] items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold transition duration-150",
                        selected
                          ? "border-(--accent) bg-(--accent-soft) text-(--foreground)"
                          : "border-(--border) bg-(--surface) text-(--muted-strong) hover:border-(--accent) hover:text-(--foreground)",
                      ].join(" ")}
                    >
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="min-h-[520px] rounded-[24px] border border-(--border) bg-(--surface) p-5 shadow-[0_18px_50px_rgba(51,94,180,0.08)]">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">{titleByTab[effectiveTab]}</h2>
                <p className="mt-1 text-sm text-(--muted-strong)">{summaryByTab[effectiveTab]}</p>
              </div>

              {renderContent()}
            </main>
          </div>
        </section>
      </AppShell>
    </RequireLogin>
  );
}
