"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/devtalk/app-shell";
import { CommentActionsMenu } from "@/components/devtalk/comment-actions-menu";
import { PostCard } from "@/components/devtalk/post-card";
import { ReportButton, ReportDialog } from "@/components/devtalk/report-dialog";
import { FetchDeleteAuth, FetchGet, FetchGetAuth, FetchPostAuth } from "@/lib/api/fetch";
import { getAuthUser, useAuthStatus } from "@/lib/auth/session";
import { CATEGORY_LABELS, type PostCategory, type PostSummary } from "@/lib/posts/types";

type PublicProfileUser = {
  id: number | string;
  username: string;
  email: string | null;
  nickname: string;
  description: string | null;
  avatarUrl: string | null;
  majors: string[];
  createdAt: string;
};

type FriendRelationship = "NONE" | "FRIEND" | "SENT" | "RECEIVED";

type PublicProfileResponse = {
  user: PublicProfileUser;
  postCount: number;
  commentCount: number;
  acceptedCommentCount: number;
  followerCount: number;
  followingCount: number;
  viewerFriendshipStatus: FriendRelationship;
  viewerFriendshipId: number | null;
  viewerFollowing: boolean;
};

type PostsResponse = {
  items: PostSummary[];
};

type ProfileComment = {
  id: string;
  postTitle: string;
  postCategory: PostCategory;
  targetUrl: string;
  body: string;
  createdAt: string;
  accepted: boolean;
};

type CommentsResponse = {
  items: ProfileComment[];
};

type FriendSearchResult = {
  user: {
    id: number | string;
  };
  relationship: FriendRelationship;
  friendshipId: number | null;
};

type ProfileTab = "posts" | "comments";

type AuthUser = {
  id?: number | string | null;
};

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: "posts", label: "게시글" },
  { id: "comments", label: "댓글" },
];

const friendButtonLabel: Record<FriendRelationship, string> = {
  NONE: "친구 추가",
  FRIEND: "친구",
  SENT: "보냄",
  RECEIVED: "친구 수락",
};

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

const isBotProfile = (user: PublicProfileUser) => {
  const marker = `${user.username} ${user.nickname}`.toLowerCase();
  return marker.includes("devtalk") || marker.includes("bot") || marker.includes("seed_writer");
};

const getProfileIdentifier = (user: PublicProfileUser) => {
  const username = user.username?.trim();
  if (isBotProfile(user)) return username ? `@${username}` : "";

  return user.email?.trim() || (username ? `@${username}` : "");
};

const asAuthUser = (value: unknown): AuthUser | null => {
  if (!value || typeof value !== "object") return null;
  return value as AuthUser;
};

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, loggedIn } = useAuthStatus();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [friendBusy, setFriendBusy] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const authUser = useMemo(() => (ready && loggedIn ? asAuthUser(getAuthUser()) : null), [ready, loggedIn]);
  const targetUserId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);
  const isOwnProfile = Boolean(id && authUser?.id != null && String(authUser.id) === String(id));

  useEffect(() => {
    if (isOwnProfile) {
      router.replace("/profile");
    }
  }, [isOwnProfile, router]);

  const profileQuery = useQuery({
    queryKey: ["profile", id, ready && loggedIn ? "auth" : "guest"],
    enabled: Boolean(id) && !isOwnProfile && ready,
    queryFn: () =>
      ((loggedIn ? FetchGetAuth(`/profile/${id}`) : FetchGet(`/profile/${id}`)) as Promise<PublicProfileResponse>),
  });

  const postsQuery = useQuery({
    queryKey: ["profile", id, "posts"],
    enabled: Boolean(id) && !isOwnProfile,
    queryFn: () => FetchGet(`/profile/${id}/posts?page=1&limit=24`) as Promise<PostsResponse>,
  });

  const commentsQuery = useQuery({
    queryKey: ["profile", id, "comments"],
    enabled: Boolean(id) && !isOwnProfile,
    queryFn: () => FetchGet(`/profile/${id}/comments?page=1&limit=24`) as Promise<CommentsResponse>,
  });

  const profile = profileQuery.data;
  const user = profile?.user;
  const nickname = user?.nickname?.trim() || "사용자";
  const description = user?.description?.trim() || "아직 등록된 소개가 없습니다.";
  const majors = useMemo(() => user?.majors?.filter(Boolean) ?? [], [user?.majors]);
  const relationshipLookupKeyword = useMemo(() => {
    const candidates = [user?.email, user?.username, user?.nickname]
      .map((value) => value?.trim() || "")
      .filter((value) => value.length >= 2);

    return candidates[0] ?? "";
  }, [user?.email, user?.nickname, user?.username]);
  const profileIdentifier = user ? getProfileIdentifier(user) : "";
  const avatarInitial = nickname.slice(0, 1).toUpperCase() || "U";
  const posts = postsQuery.data?.items ?? [];
  const comments = commentsQuery.data?.items ?? [];
  const profilePending = !ready || profileQuery.isLoading;
  const profileMissing = ready && !profilePending && (profileQuery.isError || !user);
  const publicProfile = profilePending || profileMissing ? null : profile;
  const relationshipQuery = useQuery({
    queryKey: ["profile", id, "relationship", relationshipLookupKeyword],
    enabled: Boolean(targetUserId) && loggedIn && !isOwnProfile && relationshipLookupKeyword.length >= 2,
    queryFn: async () => {
      const results = (await FetchGetAuth(`/friends/search?q=${encodeURIComponent(relationshipLookupKeyword)}`)) as FriendSearchResult[];
      return results.find((entry) => String(entry.user.id) === String(targetUserId)) ?? null;
    },
  });
  const friendshipStatus = relationshipQuery.data?.relationship ?? profile?.viewerFriendshipStatus ?? "NONE";
  const following = publicProfile?.viewerFollowing ?? false;
  const followerCount = publicProfile?.followerCount ?? 0;
  const followingCount = publicProfile?.followingCount ?? 0;

  const requireLoginForAction = () => {
    if (!ready) return true;
    if (loggedIn) return false;
    router.push("/login");
    return true;
  };

  const handleFriendAction = async () => {
    if (!targetUserId || friendBusy) return;
    if (friendshipStatus === "FRIEND" || friendshipStatus === "SENT") return;
    if (requireLoginForAction()) return;

    setFriendBusy(true);
    try {
      await FetchPostAuth("/friends/requests", { userId: targetUserId });
      await profileQuery.refetch();
      await relationshipQuery.refetch();
    } finally {
      setFriendBusy(false);
    }
  };

  const handleFollowAction = async () => {
    if (!targetUserId || followBusy) return;
    if (requireLoginForAction()) return;

    setFollowBusy(true);
    try {
      if (following) {
        await FetchDeleteAuth(`/profile/${targetUserId}/follow`);
      } else {
        await FetchPostAuth(`/profile/${targetUserId}/follow`);
      }
      await profileQuery.refetch();
    } finally {
      setFollowBusy(false);
    }
  };

  if (isOwnProfile) {
    return (
      <AppShell showPageHeader={false}>
        <section className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm text-(--muted-strong) shadow-(--shadow)">
          내 프로필로 이동 중입니다.
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell showPageHeader={false}>
      {profilePending ? (
        <section className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm text-(--muted-strong) shadow-(--shadow)">
          프로필을 불러오는 중입니다.
        </section>
      ) : null}

      {profilePending ? null : profileMissing ? (
        <section className="rounded-[28px] border border-(--border) bg-(--surface) p-6 text-sm text-(--danger) shadow-(--shadow)">
          프로필을 찾지 못했습니다.
        </section>
      ) : (
        <div className="grid gap-6">
          <section className="grid gap-6 rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px] lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              {user!.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user!.avatarUrl}
                  alt={`${nickname} 프로필 이미지`}
                  className="size-36 rounded-full border border-(--border) bg-(--surface-raised) object-cover shadow-(--shadow)"
                />
              ) : (
                <div className="grid size-36 place-items-center rounded-full border border-(--border) bg-(--accent-soft) text-5xl font-bold text-(--accent) shadow-(--shadow)">
                  {avatarInitial}
                </div>
              )}
            </div>

            <div className="grid gap-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 className="break-words text-3xl font-semibold md:text-4xl">{nickname}</h1>
                  {profileIdentifier ? <p className="mt-2 break-words text-sm text-(--muted-strong)">{profileIdentifier}</p> : null}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <CommentActionsMenu
                    items={[
                      {
                        label: friendBusy ? "친구 처리 중..." : friendButtonLabel[friendshipStatus],
                        tone: friendshipStatus === "NONE" || friendshipStatus === "RECEIVED" ? "accent" : "default",
                        disabled: friendBusy || friendshipStatus === "FRIEND" || friendshipStatus === "SENT",
                        onSelect: handleFriendAction,
                      },
                      {
                        label: followBusy ? "팔로우 처리 중..." : following ? "팔로잉" : "팔로우",
                        tone: following ? "accent" : "default",
                        disabled: followBusy,
                        onSelect: handleFollowAction,
                      },
                      {
                        label: "신고하기",
                        tone: "danger",
                        onSelect: () => setReportOpen(true),
                      },
                    ]}
                  />
                </div>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4">
                  <dt className="text-xs font-bold text-(--muted)">게시글</dt>
                  <dd className="mt-2 text-sm font-semibold">{publicProfile!.postCount}</dd>
                </div>
                <div className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4">
                  <dt className="text-xs font-bold text-(--muted)">댓글</dt>
                  <dd className="mt-2 text-sm font-semibold">{publicProfile!.commentCount}</dd>
                </div>
                <div className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4">
                  <dt className="text-xs font-bold text-(--muted)">팔로워</dt>
                  <dd className="mt-2 text-sm font-semibold">{followerCount}</dd>
                </div>
                <div className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4">
                  <dt className="text-xs font-bold text-(--muted)">팔로잉</dt>
                  <dd className="mt-2 text-sm font-semibold">{followingCount}</dd>
                </div>
                <div className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4">
                  <dt className="text-xs font-bold text-(--muted)">가입일</dt>
                  <dd className="mt-2 text-sm font-semibold">{formatDate(user!.createdAt)}</dd>
                </div>
              </dl>

              <div className="grid gap-3">
                <p className="whitespace-pre-line rounded-2xl border border-(--border) bg-(--surface-raised) p-4 text-sm leading-7 text-(--muted-strong)">
                  {description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {majors.length ? (
                    majors.map((major) => (
                      <span
                        key={major}
                        className="rounded-full border border-(--border) bg-(--accent-soft) px-3 py-1.5 text-xs font-semibold text-(--accent)"
                      >
                        {major}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-(--muted-strong)">전공 정보 없음</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-(--border) bg-(--surface) p-3 shadow-(--shadow) backdrop-blur-[18px]">
            <div className="grid grid-cols-2 gap-2">
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

            <div className="mt-3 border-t border-(--border) px-3 py-5">
              {activeTab === "posts" ? (
                <div className="grid gap-4">
                  {postsQuery.isLoading ? <p className="text-sm text-(--muted-strong)">게시글을 불러오는 중입니다.</p> : null}
                  {postsQuery.isError ? <p className="text-sm text-(--danger)">게시글을 불러오지 못했습니다.</p> : null}
                  {!postsQuery.isLoading && !postsQuery.isError && posts.length === 0 ? (
                    <p className="text-sm text-(--muted-strong)">작성한 게시글이 없습니다.</p>
                  ) : null}
                  {!postsQuery.isLoading && !postsQuery.isError ? posts.map((post) => <PostCard key={post.id} post={post} />) : null}
                </div>
              ) : (
                <div className="grid gap-3">
                  {commentsQuery.isLoading ? <p className="text-sm text-(--muted-strong)">댓글을 불러오는 중입니다.</p> : null}
                  {commentsQuery.isError ? <p className="text-sm text-(--danger)">댓글을 불러오지 못했습니다.</p> : null}
                  {!commentsQuery.isLoading && !commentsQuery.isError && comments.length === 0 ? (
                    <p className="text-sm text-(--muted-strong)">작성한 댓글이 없습니다.</p>
                  ) : null}
                  {!commentsQuery.isLoading && !commentsQuery.isError
                    ? comments.map((comment) => (
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
                              <ReportButton
                                size="sm"
                                target={{
                                  type: "comment",
                                  id: comment.id,
                                  label: `${nickname}의 댓글: ${comment.body.trim().replace(/\s+/g, " ").slice(0, 60)}`,
                                  url: comment.targetUrl,
                                }}
                              />
                            </div>
                          </div>
                          <p className="whitespace-pre-line text-sm leading-7 text-(--muted-strong)">{comment.body}</p>
                          <p className="text-xs text-(--muted-strong)">{formatDate(comment.createdAt)}</p>
                        </article>
                      ))
                    : null}
                </div>
              )}
            </div>
          </section>

          <ReportDialog
            target={{
              type: "profile",
              id: user!.id,
              label: `${nickname} 프로필`,
              url: `/profile/${user!.id}`,
            }}
            open={reportOpen}
            onOpenChange={setReportOpen}
          />
        </div>
      )}
    </AppShell>
  );
}
