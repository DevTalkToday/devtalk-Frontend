import { getAdsTxtEntry } from "@/lib/adsense/config";

export function GET() {
  return new Response(`${getAdsTxtEntry()}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
