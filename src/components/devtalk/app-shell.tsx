"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AdsenseBanner } from "@/components/ads/adsense-banner";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonClassName } from "@/components/ui";
import { getAdsenseClient, getAdsenseSlot } from "@/lib/adsense/config";
import { FetchGetAuthSilent, FetchPostAuthSilent } from "@/lib/api/fetch";
import {
  beginLogoutRedirect,
  clearAuthSession,
  finishLogoutRedirect,
  getAccessToken,
  getAuthUser,
  useAuthStatus,
} from "@/lib/auth/session";
import { startNavigationProgress } from "@/lib/navigation/progress";

type AppShellProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  sidebar?: ReactNode;
  footerSlot?: ReactNode;
  showPageHeader?: boolean;
  compactRadius?: boolean;
  children: ReactNode;
};

type ShellAuthUser = {
  id?: number | string | null;
  username?: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
};

type ProfileMeResponse = {
  user: ShellAuthUser | null;
};

type FriendReceivedCountResponse = {
  receivedCount: number;
};

type MessageUnreadCountResponse = {
  unreadCount: number;
};

type NotificationUnreadCountResponse = {
  unreadCount: number;
};

type FriendSummaryPollResponse = {
  received?: unknown[];
};

type ConversationPollResponse = {
  unreadCount?: number;
};

type NotificationPollResponse = {
  unread?: boolean;
};

type NavIndicatorState = {
  friends: boolean;
  messages: boolean;
  notifications: boolean;
};

type NavMenuChild = {
  href: string;
  label: string;
};

type PrimaryNavItem = {
  href: string;
  label: string;
  icon: string;
  children?: NavMenuChild[];
};

const primaryNavItems: PrimaryNavItem[] = [
  { href: "/", label: "홈", icon: "/home.svg" },
  {
    href: "/posts",
    label: "목록",
    icon: "/list.svg",
    children: [
      { href: "/posts", label: "게시판" },
      { href: "/recruit", label: "인원 모집" },
      { href: "/ai-portfolio", label: "AI 포폴 생성" },
    ],
  },
  { href: "/friends", label: "친구", icon: "/friend.svg" },
  { href: "/messages", label: "메시지", icon: "/chat.svg" },
  { href: "/notifications", label: "알림", icon: "/bell.svg" },
];

const emptyNavIndicatorState: NavIndicatorState = {
  friends: false,
  messages: false,
  notifications: false,
};

const globalAdsenseClient = getAdsenseClient();
const globalAdsenseSlot = getAdsenseSlot();

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

const isNavItemActive = (pathname: string, item: PrimaryNavItem) =>
  isActivePath(pathname, item.href) || item.children?.some((child) => isActivePath(pathname, child.href)) === true;

const asShellAuthUser = (value: unknown): ShellAuthUser | null => {
  if (!value || typeof value !== "object") return null;
  return value as ShellAuthUser;
};

const hasNavIndicator = (href: string, indicatorState: NavIndicatorState) => {
  if (href === "/friends") return indicatorState.friends;
  if (href === "/messages") return indicatorState.messages;
  if (href === "/notifications") return indicatorState.notifications;
  return false;
};

const loadFriendIndicator = async () => {
  try {
    const response = (await FetchGetAuthSilent("/friends/received-count")) as FriendReceivedCountResponse;
    return (response.receivedCount ?? 0) > 0;
  } catch {
    try {
      const summary = (await FetchGetAuthSilent("/friends")) as FriendSummaryPollResponse;
      return Array.isArray(summary.received) && summary.received.length > 0;
    } catch {
      return false;
    }
  }
};

const loadMessageIndicator = async () => {
  try {
    const response = (await FetchGetAuthSilent("/messages/unread-count")) as MessageUnreadCountResponse;
    return (response.unreadCount ?? 0) > 0;
  } catch {
    try {
      const conversations = (await FetchGetAuthSilent("/messages/conversations")) as ConversationPollResponse[];
      return conversations.some((conversation) => (conversation.unreadCount ?? 0) > 0);
    } catch {
      return false;
    }
  }
};

const loadNotificationIndicator = async () => {
  try {
    const response = (await FetchGetAuthSilent("/notifications/unread-count")) as NotificationUnreadCountResponse;
    return (response.unreadCount ?? 0) > 0;
  } catch {
    try {
      const notifications = (await FetchGetAuthSilent("/notifications?limit=100")) as NotificationPollResponse[];
      return notifications.some((notification) => notification.unread === true);
    } catch {
      return false;
    }
  }
};

export function AppShell({
  title,
  description,
  actions,
  sidebar,
  footerSlot,
  showPageHeader = true,
  compactRadius = true,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [shellUser, setShellUser] = useState<ShellAuthUser | null>(null);
  const [navIndicatorState, setNavIndicatorState] = useState<NavIndicatorState>(emptyNavIndicatorState);
  const [openMenuHref, setOpenMenuHref] = useState<string | null>(null);
  const openMenuRef = useRef<HTMLDivElement | null>(null);
  const { ready: authReady, loggedIn } = useAuthStatus();
  const authUser = shellUser ?? (authReady && loggedIn ? asShellAuthUser(getAuthUser()) : null);
  const profileName = authUser?.nickname?.trim() || authUser?.username?.trim() || "U";
  const profileAvatarUrl = authUser?.avatarUrl?.trim() || "";
  const profileInitial = profileName.slice(0, 1).toUpperCase() || "U";
  const profileHref = "/profile";

  useEffect(() => {
    let alive = true;

    const syncProfile = async () => {
      const storedUser = asShellAuthUser(getAuthUser());
      const hasUserSession = Boolean(storedUser && getAccessToken());

      if (!authReady || !loggedIn || !hasUserSession) {
        setShellUser(null);
        return;
      }

      setShellUser(storedUser);

      try {
        const profile = (await FetchGetAuthSilent("/profile/me")) as ProfileMeResponse;
        if (alive && getAuthUser() && getAccessToken()) setShellUser(asShellAuthUser(profile.user));
      } catch {
        if (alive) setShellUser(asShellAuthUser(getAuthUser()));
      }
    };

    void syncProfile();

    return () => {
      alive = false;
    };
  }, [authReady, loggedIn, pathname]);

  useEffect(() => {
    setOpenMenuHref(null);
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/" && authReady && !loggedIn) {
      finishLogoutRedirect();
    }
  }, [authReady, loggedIn, pathname]);

  useEffect(() => {
    if (!openMenuHref) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!openMenuRef.current?.contains(event.target as Node)) {
        setOpenMenuHref(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuHref(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuHref]);

  useEffect(() => {
    let alive = true;

    const loadNavIndicators = async () => {
      if (!authReady || !loggedIn || !getAccessToken()) {
        if (alive) setNavIndicatorState(emptyNavIndicatorState);
        return;
      }

      const [friendResult, messageResult, notificationResult] = await Promise.allSettled([
        loadFriendIndicator(),
        loadMessageIndicator(),
        loadNotificationIndicator(),
      ]);

      if (!alive) return;

      setNavIndicatorState({
        friends: friendResult.status === "fulfilled" && friendResult.value,
        messages: messageResult.status === "fulfilled" && messageResult.value,
        notifications: notificationResult.status === "fulfilled" && notificationResult.value,
      });
    };

    void loadNavIndicators();

    return () => {
      alive = false;
    };
  }, [authReady, loggedIn, pathname]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const keyword = search.trim();

    if (keyword) params.set("q", keyword);
    params.set("sort", "latest");
    params.set("page", "1");

    startNavigationProgress();
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  };

  const handleAuthButton = async () => {
    if (!loggedIn) {
      startNavigationProgress();
      router.push("/login");
      return;
    }

    beginLogoutRedirect();

    try {
      await FetchPostAuthSilent("/auth/logout");
    } catch {
      // The local session should still be cleared even if the server token is already gone.
    } finally {
      clearAuthSession();
      startNavigationProgress();
      router.replace("/");
    }
  };

  return (
    <div className={["min-h-screen overflow-x-clip px-4 py-4 md:px-6 lg:px-8", compactRadius ? "compact-radius" : ""].join(" ")}>
      <div className="mx-auto grid max-w-[1500px] gap-6">
        <div className="sticky top-4 z-20">
          <div className="pointer-events-none absolute bottom-[-1rem] left-1/2 top-[-1rem] z-0 w-screen -translate-x-1/2 bg-transparent backdrop-blur-[14px] backdrop-saturate-150" />
          <header
            className={[
              "relative z-10 border border-(--border) bg-(--surface) px-4 py-3 shadow-(--shadow) backdrop-blur-[18px]",
              compactRadius ? "rounded-[14px]" : "rounded-[28px]",
            ].join(" ")}
          >
            <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)_auto] xl:items-center">
              <nav aria-label="주요 메뉴" className="flex flex-wrap items-center gap-2">
                {primaryNavItems.map((item) => {
                  const active = isNavItemActive(pathname, item);
                  const isMenuOpen = openMenuHref === item.href;
                  const commonClassName = [
                    "relative inline-flex h-11 min-w-11 appearance-none items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold whitespace-nowrap transition duration-150 cursor-pointer",
                    active
                      ? "border-(--accent) bg-(--accent-soft) text-(--foreground)"
                      : "border-(--border) bg-(--surface-raised) text-(--muted-strong) hover:-translate-y-px hover:border-(--accent) hover:text-(--foreground)",
                  ].join(" ");

                  if (item.children?.length) {
                    return (
                      <div key={item.href} ref={isMenuOpen ? openMenuRef : null} className="relative">
                        <Link
                          href={item.href}
                          data-no-navigation-progress="true"
                          role="button"
                          title={item.label}
                          aria-label={item.label}
                          aria-haspopup="menu"
                          aria-expanded={isMenuOpen}
                          onClick={(event) => {
                            event.preventDefault();
                            setOpenMenuHref((current) => (current === item.href ? null : item.href));
                          }}
                          className={commonClassName}
                        >
                          <Image src={item.icon} alt="" width={16} height={16} className="theme-icon size-4" />
                          <span className="hidden sm:inline">{item.label}</span>
                        </Link>

                        {isMenuOpen ? (
                          <div
                            role="menu"
                            aria-label={`${item.label} 메뉴`}
                            className="absolute left-0 top-full z-30 mt-2 grid min-w-[13rem] gap-1 rounded-[22px] border border-(--border) bg-[var(--surface-solid)] p-2 shadow-(--shadow)"
                          >
                            {item.children.map((child) => {
                              const childActive = isActivePath(pathname, child.href);

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  role="menuitem"
                                  onClick={() => setOpenMenuHref(null)}
                                  className={[
                                    "rounded-[16px] px-4 py-3 text-sm font-semibold transition",
                                    childActive
                                      ? "border border-(--accent) bg-(--accent-soft) text-(--foreground)"
                                      : "border border-transparent text-(--muted-strong) hover:bg-(--surface-raised) hover:text-(--foreground)",
                                  ].join(" ")}
                                >
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      aria-label={item.label}
                      className={commonClassName}
                    >
                      {hasNavIndicator(item.href, navIndicatorState) ? (
                        <span
                          aria-hidden="true"
                          className="absolute right-2 top-2 size-2.5 rounded-full border border-(--surface) bg-(--accent)"
                        />
                      ) : null}
                      <Image src={item.icon} alt="" width={16} height={16} className="theme-icon size-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })}

                <Link
                  href={profileHref}
                  title="프로필"
                  aria-label="프로필"
                  className={[
                    "inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-(--border) bg-(--surface-raised) text-sm font-bold text-(--foreground) transition duration-150 hover:-translate-y-px hover:border-(--accent)",
                    isActivePath(pathname, "/profile") ? "border-(--accent) bg-(--accent-soft)" : "",
                  ].join(" ")}
                >
                  {profileAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profileAvatarUrl} alt="" className="size-7 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-7 place-items-center rounded-full bg-(--accent) text-xs text-(--primary-foreground)">
                      {profileInitial}
                    </span>
                  )}
                </Link>
              </nav>

              <form onSubmit={submitSearch} className="relative">
                <Image
                  src="/search.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="theme-icon pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 opacity-70"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="게시글 검색"
                  aria-label="게시글 검색"
                  className="h-12 w-full rounded-full border border-(--border) bg-(--surface-raised) px-11 text-sm text-(--foreground) outline-none transition focus:border-(--accent) focus:bg-(--surface-soft)"
                />
              </form>

              <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
                <ThemeToggle />
                <Link
                  href="/settings"
                  title="설정"
                  aria-label="설정"
                  className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-(--border) bg-(--surface-raised) transition duration-150 hover:-translate-y-px hover:border-(--accent)"
                >
                  <Image src="/config.svg" alt="" width={16} height={16} className="theme-icon size-4" />
                </Link>
                <button type="button" onClick={handleAuthButton} className={buttonClassName({ size: "sm" })}>
                  {authReady ? (loggedIn ? "로그아웃" : "로그인") : "로그인"}
                </button>
              </div>
            </div>
          </header>
        </div>

        <main className="space-y-6">
          {showPageHeader && title ? (
            <section className="grid gap-4 rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px] md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold md:text-4xl">{title}</h1>
                {description ? <p className="max-w-3xl text-sm leading-6 text-(--muted-strong)">{description}</p> : null}
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
            </section>
          ) : null}

          {sidebar ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
              <div className="space-y-6">{children}</div>
              <aside className="space-y-4 xl:sticky xl:top-24">{sidebar}</aside>
            </div>
          ) : (
            children
          )}
        </main>

        <footer className="flex flex-wrap items-center justify-center gap-3 pb-2 text-xs font-semibold text-(--muted-strong)">
          <Link href="/legal/terms" className="transition hover:text-(--foreground)">
            이용약관
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/legal/privacy" className="transition hover:text-(--foreground)">
            개인정보 처리방침
          </Link>
        </footer>
        <div className="flex justify-center empty:hidden">
          <AdsenseBanner client={globalAdsenseClient} slot={globalAdsenseSlot} label="" className="max-w-[640px]" />
        </div>
        {footerSlot ? <div className="flex justify-center empty:hidden">{footerSlot}</div> : null}
      </div>
    </div>
  );
}
