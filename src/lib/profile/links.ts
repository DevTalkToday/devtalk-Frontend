export type ProfileLinkUser = {
  id?: number | string | null;
};

export const getProfileHref = (user?: ProfileLinkUser | null) => {
  const id = user?.id == null ? "" : String(user.id).trim();
  return id ? `/profile/${encodeURIComponent(id)}` : "/profile";
};
