"use client";

import Link from "next/link";
import { type ChangeEvent, type DragEvent, type FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RequireLogin } from "@/components/auth/require-login";
import { AppShell } from "@/components/devtalk/app-shell";
import { EllipsisIcon, PlusIcon, TrashIcon } from "@/components/devtalk/icons";
import { PostCard } from "@/components/devtalk/post-card";
import { buttonClassName } from "@/components/ui";
import { FetchGetAuth, FetchPatchAuth } from "@/lib/api/fetch";
import { getAccessToken, getAuthUser, saveAuthSession, useAuthStatus } from "@/lib/auth/session";
import { CATEGORY_LABELS, type PostCategory, type PostSummary } from "@/lib/posts/types";

type ProfileTab = "info" | "posts" | "comments";

type AuthUser = {
  id?: number | string;
  username?: string | null;
  nickname?: string | null;
  email?: string | null;
  description?: string | null;
  profileCompleted?: boolean;
  majors?: string[] | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
};

type PostsResponse = {
  items: PostSummary[];
};

type ProfileResponse = {
  user: AuthUser;
  postCount: number;
  commentCount: number;
  acceptedCommentCount: number;
};

type ProfileComment = {
  id: string;
  postId: string;
  postTitle: string;
  postCategory: PostCategory;
  targetUrl: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  accepted: boolean;
};

type CommentsResponse = {
  items: ProfileComment[];
};

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: "info", label: "내 정보" },
  { id: "posts", label: "내 게시글" },
  { id: "comments", label: "내 댓글" },
];

const asAuthUser = (value: unknown): AuthUser | null => {
  if (!value || typeof value !== "object") return null;
  return value as AuthUser;
};

const cleanMajors = (items: string[]) =>
  items
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, source) => source.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index);

const formatDate = (value?: string | null) => {
  if (!value) return "가입일 정보 없음";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "가입일 정보 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export default function ProfilePage() {
  const { ready, loggedIn } = useAuthStatus();
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [localUser, setLocalUser] = useState<AuthUser | null>(null);
  const [draftNickname, setDraftNickname] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftMajors, setDraftMajors] = useState<string[]>([]);
  const [newMajor, setNewMajor] = useState("");
  const [imageDraftUrl, setImageDraftUrl] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [imageError, setImageError] = useState("");
  const [isImageDragActive, setIsImageDragActive] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  const sessionUser = useMemo(() => (ready && loggedIn ? asAuthUser(getAuthUser()) : null), [ready, loggedIn]);

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    enabled: ready && loggedIn,
    queryFn: () => FetchGetAuth("/profile/me") as Promise<ProfileResponse>,
  });

  const user = localUser ?? profileQuery.data?.user ?? sessionUser;

  const userId = user?.id == null ? "" : String(user.id);
  const nickname = user?.nickname?.trim() || user?.username?.trim() || "사용자";
  const email = user?.email?.trim() || "이메일 정보 없음";
  const description = user?.description?.trim() || "아직 등록된 설명이 없습니다.";
  const savedMajors = useMemo(() => user?.majors?.filter(Boolean) ?? [], [user?.majors]);
  const visibleMajors = isEditing ? draftMajors : savedMajors;
  const visibleNickname = isEditing ? draftNickname.trim() || nickname : nickname;
  const visibleAvatarUrl = user?.avatarUrl?.trim() || "";
  const avatarInitial = visibleNickname.slice(0, 1).toUpperCase();
  const modalAvatarInitial = nickname.slice(0, 1).toUpperCase();

  const postsQuery = useQuery({
    queryKey: ["profile", "posts", userId],
    enabled: Boolean(userId),
    queryFn: () => FetchGetAuth("/profile/me/posts?page=1&limit=48") as Promise<PostsResponse>,
  });

  const commentsQuery = useQuery({
    queryKey: ["profile", "comments", userId],
    enabled: Boolean(userId),
    queryFn: () => FetchGetAuth("/profile/me/comments?page=1&limit=48") as Promise<CommentsResponse>,
  });

  const myPosts = postsQuery.data?.items ?? [];
  const myComments = commentsQuery.data?.items ?? [];

  const persistUser = (nextUser: AuthUser) => {
    const accessToken = getAccessToken();

    setLocalUser(nextUser);
    if (accessToken) saveAuthSession(accessToken, nextUser);
  };

  const startEditing = () => {
    setDraftNickname(nickname === "사용자" ? "" : nickname);
    setDraftDescription(user?.description?.trim() ?? "");
    setDraftMajors(cleanMajors(savedMajors));
    setNewMajor("");
    setActiveTab("info");
    setIsMenuOpen(false);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setNewMajor("");
  };

  const saveProfile = async () => {
    if (savingProfile) return;

    setSavingProfile(true);
    try {
      const nextUser = (await FetchPatchAuth("/profile/me", {
        nickname: draftNickname.trim() || nickname,
        description: draftDescription.trim() || null,
        majors: cleanMajors(draftMajors),
      })) as AuthUser;

      persistUser(nextUser);
      setIsEditing(false);
      setNewMajor("");
      await profileQuery.refetch();
    } catch {
      // Request helper shows a toast with a safe message.
    } finally {
      setSavingProfile(false);
    }
  };

  const openImageModal = () => {
    setImageDraftUrl(visibleAvatarUrl);
    setImageFileName("");
    setImageError("");
    setIsMenuOpen(false);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setImageDraftUrl("");
    setImageFileName("");
    setImageError("");
    setIsImageDragActive(false);
  };

  const readImageFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("이미지 파일만 추가할 수 있습니다.");
      setImageFileName("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setImageError("이미지를 읽지 못했습니다.");
        return;
      }

      setImageDraftUrl(reader.result);
      setImageFileName(file.name);
      setImageError("");
    };
    reader.onerror = () => setImageError("이미지를 읽지 못했습니다.");
    reader.readAsDataURL(file);
  };

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    readImageFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleImageDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsImageDragActive(true);
  };

  const handleImageDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsImageDragActive(false);
    }
  };

  const handleImageDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsImageDragActive(false);
    readImageFile(event.dataTransfer.files?.[0]);
  };

  const saveProfileImage = async () => {
    if (!imageDraftUrl) {
      setImageError("이미지 파일을 선택해주세요.");
      return;
    }

    if (savingImage) return;

    setSavingImage(true);
    setImageError("");
    try {
      const nextUser = (await FetchPatchAuth("/profile/me/avatar", { avatarUrl: imageDraftUrl })) as AuthUser;
      persistUser(nextUser);
      await profileQuery.refetch();
      closeImageModal();
    } catch {
      // Request helper shows a toast with a safe message.
    } finally {
      setSavingImage(false);
    }
  };

  const addMajor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextMajor = newMajor.trim();
    if (!nextMajor) return;

    setDraftMajors((current) => cleanMajors([...current, nextMajor]));
    setNewMajor("");
  };

  const removeMajor = (major: string) => {
    setDraftMajors((current) => current.filter((item) => item !== major));
  };

  const renderTabContent = () => {
    if (activeTab === "info") {
      return (
        <div className="grid gap-3">
          <h2 className="text-xl font-semibold">설명</h2>
          {isEditing ? (
            <textarea
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              rows={5}
              className="min-h-32 w-full resize-y rounded-2xl border border-(--border) bg-(--surface-raised) p-4 text-sm leading-7 text-(--foreground) outline-none transition focus:border-(--accent)"
              placeholder="설명 정보를 입력해주세요"
            />
          ) : (
            <p className="min-h-24 whitespace-pre-line rounded-2xl border border-(--border) bg-(--surface-raised) p-4 text-sm leading-7 text-(--muted-strong)">
              {description}
            </p>
          )}
        </div>
      );
    }

    if (activeTab === "posts") {
      return (
        <div className="grid gap-4">
          {postsQuery.isLoading ? <p className="text-sm text-(--muted-strong)">내 게시글을 불러오는 중입니다.</p> : null}
          {postsQuery.isError ? <p className="text-sm text-(--danger)">내 게시글을 불러오지 못했습니다.</p> : null}
          {!postsQuery.isLoading && !postsQuery.isError && myPosts.length === 0 ? (
            <p className="text-sm text-(--muted-strong)">작성한 게시글이 없습니다.</p>
          ) : null}
          {!postsQuery.isLoading && !postsQuery.isError
            ? myPosts.map((post) => <PostCard key={post.id} post={post} />)
            : null}
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        {commentsQuery.isLoading ? <p className="text-sm text-(--muted-strong)">내 댓글을 불러오는 중입니다.</p> : null}
        {commentsQuery.isError ? <p className="text-sm text-(--danger)">내 댓글을 불러오지 못했습니다.</p> : null}
        {!commentsQuery.isLoading && !commentsQuery.isError && myComments.length === 0 ? (
          <p className="text-sm text-(--muted-strong)">작성한 댓글이 없습니다.</p>
        ) : null}
        {!commentsQuery.isLoading && !commentsQuery.isError
          ? myComments.map((comment) => (
              <article key={comment.id} className="grid gap-3 rounded-[20px] border border-(--border) bg-(--surface-raised) p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={comment.targetUrl} className="font-semibold transition hover:text-(--accent)">
                    {comment.postTitle}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--muted-strong)">
                      {CATEGORY_LABELS[comment.postCategory]}
                    </span>
                    {comment.accepted ? (
                      <span className="rounded-full border border-(--accent) bg-(--accent-soft) px-3 py-1 text-xs font-semibold text-(--accent)">
                        채택됨
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="whitespace-pre-line text-sm leading-7 text-(--muted-strong)">{comment.body}</p>
                <p className="text-xs text-(--muted-strong)">{formatDate(comment.createdAt)}</p>
              </article>
            ))
          : null}
      </div>
    );
  };

  return (
    <RequireLogin>
      <AppShell showPageHeader={false}>
      <div className="grid gap-6">
        <section className="relative grid gap-6 rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px] lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
          <div className="absolute right-5 top-5 z-10">
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-label="프로필 설정"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              title="설정"
              className="grid size-10 place-items-center rounded-full border border-(--border) bg-(--surface-raised) text-(--muted-strong) transition hover:-translate-y-px hover:border-(--accent) hover:text-(--foreground)"
            >
              <EllipsisIcon className="size-5" />
            </button>

            {isMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 grid min-w-36 overflow-hidden rounded-2xl border border-(--border) bg-(--surface) p-1 text-sm font-semibold shadow-(--shadow)"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={startEditing}
                  className="rounded-xl px-4 py-3 text-left transition hover:bg-(--surface-raised)"
                >
                  수정
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={openImageModal}
                  className="rounded-xl px-4 py-3 text-left transition hover:bg-(--surface-raised)"
                >
                  이미지 변경
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex h-full flex-col items-center justify-center">
            {visibleAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={visibleAvatarUrl}
                alt={`${visibleNickname} 프로필 이미지`}
                className="size-36 rounded-full border border-(--border) bg-(--surface-raised) object-cover shadow-(--shadow)"
              />
            ) : (
              <div
                aria-label="프로필 이미지"
                className="grid size-36 place-items-center rounded-full border border-(--border) bg-(--accent-soft) text-5xl font-bold text-(--accent) shadow-(--shadow)"
              >
                {avatarInitial}
              </div>
            )}
          </div>

          <div className="grid gap-5 pr-12">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                {isEditing ? (
                  <input
                    value={draftNickname}
                    onChange={(event) => setDraftNickname(event.target.value)}
                    className="min-h-12 w-full max-w-lg rounded-2xl border border-(--border) bg-(--surface-raised) px-4 text-3xl font-semibold text-(--foreground) outline-none transition focus:border-(--accent) md:text-4xl"
                    placeholder="이름"
                  />
                ) : (
                  <h1 className="break-words text-3xl font-semibold md:text-4xl">{ready ? visibleNickname : "프로필"}</h1>
                )}
              </div>

              {!loggedIn && ready ? (
                <Link href="/login" className={buttonClassName({ variant: "primary", size: "sm" })}>
                  로그인
                </Link>
              ) : null}

              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={cancelEditing} className={buttonClassName({ size: "sm" })}>
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={saveProfile}
                    className={buttonClassName({ variant: "primary", size: "sm" })}
                    disabled={savingProfile}
                  >
                    수정
                  </button>
                </div>
              ) : null}
            </div>

            {profileQuery.isError ? (
              <p className="text-sm font-semibold text-(--danger)">프로필을 불러오지 못했습니다.</p>
            ) : null}
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4">
                <dt className="text-xs font-bold text-(--muted)">이름</dt>
                <dd className="mt-2 break-words text-sm font-semibold">{visibleNickname}</dd>
              </div>
              <div className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4">
                <dt className="text-xs font-bold text-(--muted)">이메일</dt>
                <dd className="mt-2 break-words text-sm font-semibold">{email}</dd>
              </div>
              <div className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4">
                <dt className="text-xs font-bold text-(--muted)">가입일</dt>
                <dd className="mt-2 break-words text-sm font-semibold">{formatDate(user?.createdAt)}</dd>
              </div>
            </dl>

            <div className="grid gap-2">
              <p className="text-sm font-semibold">전공/관심 분야</p>
              <div className="flex flex-wrap items-center gap-2">
                {visibleMajors.length ? (
                  visibleMajors.map((major) => (
                    <span
                      key={major}
                      className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--accent-soft) px-3 py-1.5 text-xs font-semibold text-(--accent)"
                    >
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => removeMajor(major)}
                          aria-label={`${major} 삭제`}
                          className="-ml-1 grid size-6 place-items-center rounded-full text-(--danger) transition hover:bg-(--surface)"
                        >
                          <TrashIcon className="size-3.5" />
                        </button>
                      ) : null}
                      {major}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-(--muted-strong)">전공 정보 없음</span>
                )}

                {isEditing ? (
                  <form onSubmit={addMajor} className="flex min-w-[220px] items-center gap-2">
                    <input
                      value={newMajor}
                      onChange={(event) => setNewMajor(event.target.value)}
                      className="h-10 min-w-0 flex-1 rounded-full border border-(--border) bg-(--surface-raised) px-3 text-sm text-(--foreground) outline-none transition focus:border-(--accent)"
                      placeholder="전공 또는 관심 분야 추가"
                    />
                    <button
                      type="submit"
                      aria-label="전공 또는 관심 분야 추가"
                      className="grid size-10 place-items-center rounded-full border border-(--accent) bg-(--accent) text-(--primary-foreground) transition hover:-translate-y-px hover:brightness-110"
                    >
                      <PlusIcon className="size-4" />
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-(--border) bg-(--surface) p-3 shadow-(--shadow) backdrop-blur-[18px]">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "min-h-12 rounded-[18px] px-3 text-sm font-semibold transition duration-150",
                  activeTab === tab.id
                    ? "border border-(--accent) bg-(--accent-soft) text-(--foreground)"
                    : "border border-transparent text-(--muted-strong) hover:bg-(--surface-raised) hover:text-(--foreground)",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-3 border-t border-(--border) px-3 py-5">{renderTabContent()}</div>
        </section>
      </div>

      {isImageModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-image-modal-title"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
        >
          <section className="w-full max-w-[520px] rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="profile-image-modal-title" className="text-xl font-semibold">
                  프로필 이미지 변경
                </h2>
              </div>
              <button
                type="button"
                onClick={closeImageModal}
                aria-label="프로필 이미지 변경 닫기"
                className="grid size-10 place-items-center rounded-full border border-(--border) bg-(--surface-raised) text-(--muted-strong) transition hover:border-(--accent) hover:text-(--foreground)"
              >
                <span aria-hidden="true">x</span>
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <div className="grid justify-items-center gap-3">
                <p className="text-sm font-semibold">프로필 이미지 미리보기</p>
                <div className="grid size-44 place-items-center overflow-hidden rounded-full border border-(--border) bg-(--accent-soft) text-5xl font-bold text-(--accent) shadow-(--shadow)">
                  {imageDraftUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageDraftUrl} alt="프로필 이미지 미리보기" className="size-full object-cover" />
                  ) : (
                    modalAvatarInitial
                  )}
                </div>
              </div>

              <label
                onDragEnter={handleImageDragOver}
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
                className={[
                  "grid cursor-pointer gap-2 rounded-2xl border border-dashed p-5 text-center transition",
                  isImageDragActive
                    ? "border-(--accent) bg-(--accent-soft)"
                    : "border-(--border) bg-(--surface-raised) hover:border-(--accent) hover:bg-(--surface-soft)",
                ].join(" ")}
              >
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageFileChange} />
                <span className="font-semibold">이미지 파일 선택 또는 드롭</span>
                <span className="text-sm leading-6 text-(--muted-strong)">JPG, PNG, WebP 파일을 선택할 수 있습니다.</span>
              </label>

              {imageFileName ? <p className="text-sm text-(--muted-strong)">선택한 파일: {imageFileName}</p> : null}
              {imageError ? <p className="text-sm font-semibold text-(--danger)">{imageError}</p> : null}

              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={closeImageModal} className={buttonClassName({ size: "sm" })}>
                  취소
                </button>
                <button
                  type="button"
                  onClick={saveProfileImage}
                  className={buttonClassName({ variant: "primary", size: "sm" })}
                  disabled={!imageDraftUrl || savingImage}
                >
                  저장
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
      </AppShell>
    </RequireLogin>
  );
}
