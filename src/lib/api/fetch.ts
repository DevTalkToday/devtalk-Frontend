// "use client";

// type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// type RequestOptions = {
//   method: HttpMethod;
//   path: string;
//   data?: unknown;
//   auth?: boolean;
//   noStore?: boolean;
// };

// const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

// const parsePayload = async (res: Response) => {
//   const ct = res.headers.get("content-type") || "";
//   if (ct.includes("application/json")) {
//     try {
//       return await res.json();
//     } catch {
//       return null;
//     }
//   }
//   return await res.text();
// };

// const request = async ({ method, path, data, auth, noStore }: RequestOptions) => {
//   const accessToken = auth ? localStorage.getItem("accessToken") : null;

//   const res = await fetch(`${API_URL}${path}`, {
//     method,
//     headers: {
//       ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
//       "ngrok-skip-browser-warning": "true",
//       ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
//     },
//     body: data === undefined || data === null ? undefined : JSON.stringify(data),
//     cache: noStore ? "no-store" : "default",
//   });

//   const payload = await parsePayload(res);

//   if (!res.ok) {
//     const msg = typeof payload === "string" ? payload : JSON.stringify(payload);
//     throw new Error(msg);
//   }

//   return payload;
// };

// export const FetchGet = (path: string) =>
//   request({ method: "GET", path, auth: false, noStore: true });

// export const FetchPost = (path: string, data?: unknown) =>
//   request({ method: "POST", path, data, auth: false, noStore: true });

// export const FetchDelete = (path: string) =>
//   request({ method: "DELETE", path, auth: false, noStore: true });

// export const FetchGetAuth = (path: string) =>
//   request({ method: "GET", path, auth: true, noStore: true });

// export const FetchPostAuth = (path: string, data?: unknown) =>
//   request({ method: "POST", path, data, auth: true, noStore: true });

// export const FetchDeleteAuth = (path: string) =>
//   request({ method: "DELETE", path, auth: true, noStore: true });

"use client";

import { clearAuthSession, getOptionalUserAccessToken, getRequiredAccessToken, isLogoutRedirecting } from "@/lib/auth/session";
import { normalizePostApiResponse } from "@/lib/posts/response";
import { showErrorToast } from "@/lib/toast/events";

export class ApiRequestError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type AuthMode = "none" | "optional" | "required";

type RequestOptions = {
  method: HttpMethod;
  path: string;
  data?: unknown;
  auth?: AuthMode;
  noStore?: boolean;
  suppressErrorToast?: boolean;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

const resolveUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (/^https?:\/\//.test(path)) return path;

  return API_URL ? `${API_URL}${normalizedPath}` : normalizedPath;
};

const parsePayload = async (res: Response) => {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return await res.text();
};

const ERROR_MESSAGES: Record<string, string> = {
  TITLE_AND_CONTENT_REQUIRED: "필수 정보를 입력해주세요.",
  COMMENT_BODY_REQUIRED: "댓글 내용을 입력해주세요.",
  COMMENT_ACCEPTED_REQUIRED: "필수 정보를 입력해주세요.",
  COMMENT_ACCEPT_ONLY_FOR_QNA_OR_BUG: "채택할 수 없는 댓글입니다.",
  POST_MODIFY_FORBIDDEN: "권한이 없습니다.",
  COMMENT_MODIFY_FORBIDDEN: "권한이 없습니다.",
  COMMENT_DELETE_FORBIDDEN: "권한이 없습니다.",
  NOT_FOUND: "대상을 찾을 수 없습니다.",
  COMMENT_NOT_FOUND: "댓글을 찾을 수 없습니다.",
  "Email already exists": "이미 사용 중인 이메일입니다.",
  "Email verification is required": "이메일 인증을 먼저 완료해주세요.",
  "Email verification code is invalid": "인증번호가 올바르지 않습니다.",
  "Email verification code expired": "인증번호가 만료되었습니다. 다시 요청해주세요.",
  "Email verification request is too frequent": "인증번호 요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.",
  "Login is required": "로그인이 필요합니다.",
  "Login session expired": "로그인 세션이 만료되었습니다. 다시 로그인해주세요.",
  "Invalid username or password": "아이디 또는 비밀번호를 확인해주세요.",
  "Bearer token is required": "로그인이 필요합니다.",
  "Invalid access token": "다시 로그인해주세요.",
  "Access token expired": "다시 로그인해주세요.",
  "Password confirmation does not match": "비밀번호 확인이 일치하지 않습니다.",
  CURRENT_PASSWORD_REQUIRED: "현재 비밀번호를 입력해주세요.",
  CURRENT_PASSWORD_INCORRECT: "현재 비밀번호가 올바르지 않습니다.",
  NEW_PASSWORD_INVALID: "새 비밀번호는 8자 이상 입력해주세요.",
  NEW_PASSWORD_MISMATCH: "새 비밀번호 확인이 일치하지 않습니다.",
  PASSWORD_CHANGE_UNAVAILABLE: "이 계정은 비밀번호를 변경할 수 없습니다.",
  NOTIFICATION_TYPE_NOT_CONFIGURABLE: "변경할 수 없는 알림 설정입니다.",
  NOTIFICATION_SETTING_REQUIRED: "알림 설정 값을 확인해주세요.",
  ADMIN_REQUIRED: "관리자 권한이 필요합니다.",
  ADMIN_USER_DELETE_FORBIDDEN: "관리자 계정은 삭제할 수 없습니다.",
  GUEST_USER_DELETE_FORBIDDEN: "게스트 계정은 삭제할 수 없습니다.",
  REPORT_TARGET_REQUIRED: "신고 대상을 확인해주세요.",
  REPORT_CONTENT_REQUIRED: "신고 제목과 내용을 입력해주세요.",
  USER_NOT_FOUND: "유저를 찾을 수 없습니다.",
  NICKNAME_REQUIRED: "닉네임을 입력해주세요.",
  INVALID_AVATAR_URL: "프로필 이미지 주소가 올바르지 않습니다.",
  "Notification not found": "알림을 찾을 수 없습니다.",
  "User not found": "유저를 찾을 수 없습니다.",
  "Cannot add yourself as a friend": "자기 자신에게는 친구 요청을 보낼 수 없습니다.",
  "Already friends": "이미 친구인 사용자입니다.",
  "Friend request already sent": "이미 친구 요청을 보낸 사용자입니다.",
  "Friend request is not pending": "이미 처리되었거나 취소된 친구 요청입니다.",
  "Only the recipient can accept this request": "받은 친구 요청만 수락할 수 있습니다.",
  "Cannot modify this friendship": "이 친구 관계를 변경할 권한이 없습니다.",
  "Friendship not found": "친구 관계를 찾을 수 없습니다.",
  MESSAGE_BODY_REQUIRED: "메시지 내용을 입력해주세요.",
  MESSAGE_BODY_TOO_LONG: "메시지는 2,000자 이하로 입력해주세요.",
  "Cannot send a message to yourself": "자기 자신에게는 메시지를 보낼 수 없습니다.",
  "Only friends can message each other": "친구에게만 메시지를 보낼 수 있습니다.",
  "Only accepted friends can message each other": "친구 요청이 수락된 사용자에게만 메시지를 보낼 수 있습니다.",
  "GitHub redirect URI is not allowed": "GitHub 로그인 주소가 허용된 주소와 다릅니다.",
  "GitHub OAuth client is not configured": "GitHub 로그인 설정이 완료되지 않았습니다.",
  "Failed to read GitHub user profile": "GitHub 프로필 정보를 가져오지 못했습니다.",
  "GitHub authorization code exchange failed": "GitHub 로그인 인증에 실패했습니다. 다시 시도해주세요.",
  "Could not connect to GitHub": "GitHub에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
  "GitHub user profile request failed": "GitHub 사용자 정보를 가져오지 못했습니다.",
  "Google redirect URI is not allowed": "Google 로그인 주소가 허용된 주소와 다릅니다.",
  "Google OAuth client is not configured": "Google 로그인 설정이 완료되지 않았습니다.",
  "Failed to read Google user profile": "Google 프로필 정보를 가져오지 못했습니다.",
  "Google email is not verified": "Google 계정의 이메일 인증이 완료되지 않았습니다.",
  "Google authorization code exchange failed": "Google 로그인 인증에 실패했습니다. 다시 시도해주세요.",
  "Could not connect to Google": "Google에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
  "Google user profile request failed": "Google 사용자 정보를 가져오지 못했습니다.",
  "Request failed": "요청 처리 중 오류가 발생했습니다.",
  "Invalid request": "입력값을 확인해주세요.",
};

const VALIDATION_FIELD_LABELS: Record<string, string> = {
  username: "이메일",
  email: "이메일",
  password: "비밀번호",
  passwordConfirm: "비밀번호 확인",
  nickname: "닉네임",
  description: "소개",
  majors: "전공/관심 분야",
  userId: "사용자",
  recipientId: "받는 사람",
  body: "내용",
  code: "인증 코드",
  redirectUri: "로그인 주소",
  avatarUrl: "프로필 이미지",
};

const translateValidationMessage = (message: string) => {
  const [field, ...rest] = message.split(" ");
  const detail = rest.join(" ");
  const label = VALIDATION_FIELD_LABELS[field];
  if (!label || !detail) return "";

  if (detail.includes("must not be blank") || detail.includes("must not be null")) {
    return `${label}을(를) 입력해주세요.`;
  }
  if (detail.includes("must be a well-formed email address")) {
    return "올바른 이메일 주소를 입력해주세요.";
  }

  const maxMatch = detail.match(/size must be between 0 and (\d+)/);
  if (maxMatch) return `${label}은(는) ${maxMatch[1]}자 이하로 입력해주세요.`;

  const minMatch = detail.match(/size must be between (\d+) and (\d+)/);
  if (minMatch) return `${label}은(는) ${minMatch[1]}자 이상 ${minMatch[2]}자 이하로 입력해주세요.`;

  return "";
};

const readPayloadMessage = (payload: unknown) => {
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload) as unknown;
      return readPayloadMessage(parsed);
    } catch {
      return payload;
    }
  }

  if (!payload || typeof payload !== "object") return "";
  const record = payload as { message?: unknown; error?: unknown };
  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;
  return "";
};

const getFriendlyErrorMessage = (status: number, payload: unknown) => {
  const code = readPayloadMessage(payload);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (code === "Failed to send verification email") {
    return "Verification email could not be sent. Check SMTP settings and try again.";
  }
  if (code) {
    const validationMessage = translateValidationMessage(code);
    if (validationMessage) return validationMessage;
  }

  if (status === 400 || status === 422) return "필수 정보를 입력해주세요.";
  if (status === 401) return "로그인이 필요합니다.";
  if (status === 403) return "권한이 없습니다.";
  if (status === 404) return "대상을 찾을 수 없습니다.";
  if (status === 409) return "이미 처리된 요청입니다.";
  if (status === 429) return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  if (status >= 500) return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  return "요청을 처리하지 못했습니다.";
};

const resolveAccessToken = (auth: AuthMode | undefined) => {
  if (auth === "required") return getRequiredAccessToken();
  if (auth === "optional") return getOptionalUserAccessToken();
  return null;
};

const request = async ({ method, path, data, auth, noStore, suppressErrorToast = false }: RequestOptions) => {
  const shouldSuppressErrorToast = suppressErrorToast || (auth === "required" && isLogoutRedirecting());
  let accessToken: string | null;
  try {
    accessToken = resolveAccessToken(auth);
  } catch {
    const message = getFriendlyErrorMessage(401, { message: "Login is required" });
    if (!shouldSuppressErrorToast) {
      showErrorToast(message);
    }
    throw new ApiRequestError(message, 401);
  }

  const url = resolveUrl(path);

  const send = (token: string | null) => fetch(url, {
    method,
    headers: {
      ...(data === undefined || data === null ? {} : { "Content-Type": "application/json" }),
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data === undefined || data === null ? undefined : JSON.stringify(data),
    cache: noStore ? "no-store" : "default",
  });

  let res: Response;
  let payload: unknown;

  try {
    res = await send(accessToken);
    payload = await parsePayload(res);
  } catch {
    const message = "서버에 연결할 수 없습니다.";
    if (!shouldSuppressErrorToast) {
      showErrorToast(message);
    }
    throw new ApiRequestError(message, 0);
  }

  if (!res.ok) {
    if (auth === "required" && res.status === 401) {
      clearAuthSession();
    }

    const message = getFriendlyErrorMessage(res.status, payload);
    if (!shouldSuppressErrorToast) {
      showErrorToast(message);
    }
    throw new ApiRequestError(message, res.status, payload);
  }

  return normalizePostApiResponse(path, payload);
};

export const FetchGet = (path: string) => request({ method: "GET", path, auth: "optional", noStore: true });
export const FetchPost = (path: string, data?: unknown) => request({ method: "POST", path, auth: "none", data, noStore: true });
export const FetchPostOptionalAuth = (path: string, data?: unknown) => request({ method: "POST", path, auth: "optional", data, noStore: true });
export const FetchPut = (path: string, data?: unknown) => request({ method: "PUT", path, auth: "none", data, noStore: true });
export const FetchPatch = (path: string, data?: unknown) => request({ method: "PATCH", path, auth: "none", data, noStore: true });
export const FetchDelete = (path: string) => request({ method: "DELETE", path, auth: "none", noStore: true });

export const FetchGetAuth = (path: string) => request({ method: "GET", path, auth: "required", noStore: true });
export const FetchGetAuthSilent = (path: string) =>
  request({ method: "GET", path, auth: "required", noStore: true, suppressErrorToast: true });
export const FetchPostAuth = (path: string, data?: unknown) => request({ method: "POST", path, auth: "required", data, noStore: true });
export const FetchPostAuthSilent = (path: string, data?: unknown) =>
  request({ method: "POST", path, auth: "required", data, noStore: true, suppressErrorToast: true });
export const FetchPutAuth = (path: string, data?: unknown) => request({ method: "PUT", path, auth: "required", data, noStore: true });
export const FetchPatchAuth = (path: string, data?: unknown) => request({ method: "PATCH", path, auth: "required", data, noStore: true });
export const FetchDeleteAuth = (path: string) => request({ method: "DELETE", path, auth: "required", noStore: true });
