"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RequireLogin } from "@/components/auth/require-login";
import { AppShell } from "@/components/devtalk/app-shell";
import { Button } from "@/components/ui";
import { FetchDeleteAuth, FetchGetAuth, FetchPatchAuth, FetchPostAuth } from "@/lib/api/fetch";
import { getProfileHref } from "@/lib/profile/links";

type FriendTab = "friends" | "received" | "sent";
type Relationship = "NONE" | "FRIEND" | "SENT" | "RECEIVED";

type FriendUser = {
  id: number;
  username: string;
  nickname: string;
  description: string | null;
  majors: string[];
};

type Friendship = {
  id: number;
  status: "PENDING" | "ACCEPTED";
  user: FriendUser;
  createdAt: string;
  respondedAt: string | null;
};

type FriendSummary = {
  friends: Friendship[];
  received: Friendship[];
  sent: Friendship[];
};

type SearchResult = {
  user: FriendUser;
  relationship: Relationship;
  friendshipId: number | null;
};

const emptySummary: FriendSummary = {
  friends: [],
  received: [],
  sent: [],
};

const tabs: Array<{ id: FriendTab; label: string }> = [
  { id: "friends", label: "친구 목록" },
  { id: "received", label: "받은 요청" },
  { id: "sent", label: "보낸 요청" },
];

const titleByTab: Record<FriendTab, string> = {
  friends: "친구 목록",
  received: "받은 요청",
  sent: "보낸 요청",
};

const summaryByTab: Record<FriendTab, string> = {
  friends: "함께 개발 기록을 공유하는 사람들입니다.",
  received: "나에게 친구 요청을 보낸 사람들입니다.",
  sent: "내가 친구 요청을 보낸 사람들입니다.",
};

const accentColors = ["#2563ff", "#14b8a6", "#f97316", "#7c3aed", "#0891b2", "#db2777", "#16a34a"];

function getAccent(id: number) {
  return accentColors[id % accentColors.length];
}

function getMajor(user: FriendUser) {
  return user.majors.length > 0 ? user.majors.join(", ") : "전공 미입력";
}

function getDescription(user: FriendUser) {
  return user.description?.trim() || `@${user.username}`;
}

function ProfileCard({
  friendship,
  tab,
  busy,
  onAccept,
  onDelete,
}: {
  friendship: Friendship;
  tab: FriendTab;
  busy: boolean;
  onAccept: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const person = friendship.user;
  const profileHref = getProfileHref(person);

  return (
    <article className="grid gap-4 rounded-[24px] border border-(--border) bg-(--surface-raised) p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
      <Link
        href={profileHref}
        className="grid size-14 place-items-center rounded-full text-lg font-bold text-white"
        style={{ backgroundColor: getAccent(person.id) }}
        aria-label={`${person.nickname} 프로필`}
      >
        {person.nickname.slice(0, 1).toUpperCase()}
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={profileHref} className="text-lg font-semibold transition hover:text-(--accent)">
            {person.nickname}
          </Link>
          <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--muted-strong)">
            {getMajor(person)}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-(--muted-strong)">{getDescription(person)}</p>
      </div>

      {tab === "friends" ? (
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Link
            href={`/messages?userId=${person.id}`}
            title="채팅"
            aria-label={`${person.nickname}님과 채팅`}
            className="inline-flex size-11 items-center justify-center rounded-full border border-(--border) bg-(--surface-raised) transition duration-150 hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface-soft)"
          >
            <Image src="/chat2.svg" alt="" width={18} height={18} className="theme-icon size-[18px]" />
          </Link>
          <Button type="button" size="sm" variant="danger" disabled={busy} onClick={() => onDelete(friendship.id)}>
            친구 삭제
          </Button>
        </div>
      ) : null}

      {tab === "received" ? (
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button type="button" size="sm" variant="primary" disabled={busy} onClick={() => onAccept(friendship.id)}>
            수락
          </Button>
          <Button type="button" size="sm" disabled={busy} onClick={() => onDelete(friendship.id)}>
            거절
          </Button>
        </div>
      ) : null}

      {tab === "sent" ? (
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button type="button" size="sm" disabled={busy} onClick={() => onDelete(friendship.id)}>
            요청 취소
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function SearchCard({
  result,
  busy,
  onRequest,
}: {
  result: SearchResult;
  busy: boolean;
  onRequest: (userId: number) => void;
}) {
  const disabled = busy || result.relationship !== "NONE";
  const profileHref = getProfileHref(result.user);
  const labelByRelationship: Record<Relationship, string> = {
    NONE: "친구 요청",
    FRIEND: "이미 친구",
    SENT: "요청 보냄",
    RECEIVED: "받은 요청",
  };

  return (
    <article className="grid gap-4 rounded-[20px] border border-(--border) bg-(--surface-raised) p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
      <Link
        href={profileHref}
        className="grid size-12 place-items-center rounded-full text-base font-bold text-white"
        style={{ backgroundColor: getAccent(result.user.id) }}
        aria-label={`${result.user.nickname} 프로필`}
      >
        {result.user.nickname.slice(0, 1).toUpperCase()}
      </Link>
      <div className="min-w-0">
        <Link href={profileHref} className="font-semibold transition hover:text-(--accent)">
          {result.user.nickname}
        </Link>
        <p className="mt-1 text-sm text-(--muted-strong)">{getDescription(result.user)}</p>
      </div>
      <Button type="button" size="sm" disabled={disabled} onClick={() => onRequest(result.user.id)}>
        {labelByRelationship[result.relationship]}
      </Button>
    </article>
  );
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<FriendTab>("friends");
  const [summary, setSummary] = useState<FriendSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const items = summary[activeTab];

  const loadSummary = async () => {
    const data = (await FetchGetAuth("/friends")) as FriendSummary;
    setSummary(data);
  };

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      try {
        const data = (await FetchGetAuth("/friends")) as FriendSummary;
        if (alive) setSummary(data);
      } catch {
        if (alive) setSummary(emptySummary);
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const keyword = search.trim();
    if (keyword.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    let alive = true;
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const data = (await FetchGetAuth(`/friends/search?q=${encodeURIComponent(keyword)}`)) as SearchResult[];
        if (alive) setSearchResults(data);
      } catch {
        if (alive) setSearchResults([]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 250);

    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [search]);

  const counts = useMemo(
    () => ({
      friends: summary.friends.length,
      received: summary.received.length,
      sent: summary.sent.length,
    }),
    [summary],
  );

  const runAction = async (id: number, action: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await action();
      await loadSummary();
      if (search.trim().length >= 2) {
        const data = (await FetchGetAuth(`/friends/search?q=${encodeURIComponent(search.trim())}`)) as SearchResult[];
        setSearchResults(data);
      }
    } catch {
      await loadSummary().catch(() => setSummary(emptySummary));
    } finally {
      setBusyId(null);
    }
  };

  const handleRequest = (userId: number) => {
    runAction(userId, () => FetchPostAuth("/friends/requests", { userId }));
  };

  const handleAccept = (id: number) => {
    runAction(id, () => FetchPatchAuth(`/friends/requests/${id}/accept`));
  };

  const handleDelete = (id: number) => {
    runAction(id, () => FetchDeleteAuth(`/friends/${id}`));
  };

  return (
    <RequireLogin>
      <AppShell showPageHeader={false}>
        <section className="rounded-[28px] border border-(--border) bg-white/88 p-5 shadow-(--shadow) backdrop-blur-[18px] dark:bg-(--surface)">
          <div className="grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="rounded-[24px] border border-(--border) bg-white p-4 shadow-[0_18px_50px_rgba(51,94,180,0.08)] dark:bg-(--surface-raised)">
              <h1 className="px-3 pb-4 text-3xl font-semibold">친구</h1>
              <div className="grid gap-3">
                {tabs.map((tab) => {
                  const selected = tab.id === activeTab;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={[
                        "flex h-[3.25rem] items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold transition duration-150",
                        selected
                          ? "border-(--accent) bg-(--accent-soft) text-(--foreground)"
                          : "border-(--border) bg-white text-(--muted-strong) hover:border-(--accent) hover:text-(--foreground) dark:bg-(--surface)",
                      ].join(" ")}
                    >
                      <span>{tab.label}</span>
                      <span className="text-xs">{counts[tab.id]}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="min-h-[520px] rounded-[24px] border border-(--border) bg-white p-5 shadow-[0_18px_50px_rgba(51,94,180,0.08)] dark:bg-(--surface)">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{titleByTab[activeTab]}</h2>
                  <p className="mt-1 text-sm text-(--muted-strong)">{summaryByTab[activeTab]}</p>
                </div>
                <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--muted-strong)">
                  {items.length}명
                </span>
              </div>

              <div className="mb-5 grid gap-3 rounded-[20px] border border-(--border) bg-(--surface-soft) p-4">
                <label className="text-sm font-semibold" htmlFor="friend-search">
                  사용자 검색
                </label>
                <input
                  id="friend-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="닉네임, 아이디, 이메일로 검색"
                  className="h-12 w-full rounded-full border border-(--border) bg-white px-4 text-sm text-(--foreground) outline-none transition focus:border-(--accent) dark:bg-(--surface-raised)"
                />
                {search.trim().length >= 2 ? (
                  <div className="grid gap-2">
                    {searching ? <p className="text-sm text-(--muted-strong)">검색 중입니다.</p> : null}
                    {!searching && searchResults.length === 0 ? (
                      <p className="text-sm text-(--muted-strong)">검색 결과가 없습니다.</p>
                    ) : null}
                    {searchResults.map((result) => (
                      <SearchCard
                        key={result.user.id}
                        result={result}
                        busy={busyId === result.user.id}
                        onRequest={handleRequest}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3">
                {loading ? <p className="text-sm text-(--muted-strong)">친구 목록을 불러오는 중입니다.</p> : null}
                {!loading && items.length === 0 ? (
                  <p className="rounded-[20px] border border-(--border) bg-(--surface-raised) p-5 text-sm text-(--muted-strong)">
                    표시할 항목이 없습니다.
                  </p>
                ) : null}
                {items.map((friendship) => (
                  <ProfileCard
                    key={friendship.id}
                    friendship={friendship}
                    tab={activeTab}
                    busy={busyId === friendship.id}
                    onAccept={handleAccept}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </AppShell>
    </RequireLogin>
  );
}
