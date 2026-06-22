import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site/config";

const PUBLIC_ROUTES = ["/", "/posts", "/recruit", "/ai-portfolio", "/legal/terms", "/legal/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" || route === "/posts" ? "daily" : "weekly",
    priority: route === "/" ? 1 : route === "/posts" ? 0.9 : 0.6,
  }));
}
