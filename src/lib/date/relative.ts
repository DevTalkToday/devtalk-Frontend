const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const getStartOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

export const formatRelativePostDate = (value: string, now = new Date()) => {
  const target = new Date(value);
  const diffMs = Math.max(now.getTime() - target.getTime(), 0);

  if (diffMs < MINUTE) {
    const seconds = Math.max(1, Math.floor(diffMs / SECOND));
    return `${seconds}초 전`;
  }

  if (diffMs < HOUR) {
    return `${Math.floor(diffMs / MINUTE)}분 전`;
  }

  if (diffMs < DAY) {
    return `${Math.floor(diffMs / HOUR)}시간 전`;
  }

  const dayDiff = Math.floor((getStartOfDay(now) - getStartOfDay(target)) / DAY);

  if (dayDiff === 1) return "어제";
  if (dayDiff < 7) return `${dayDiff}일 전`;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(target);
};
