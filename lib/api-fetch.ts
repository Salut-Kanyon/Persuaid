import { apiUrl } from "@/lib/api-base";

/** Fetch a Next.js API route, honoring `NEXT_PUBLIC_API_BASE_URL` for packaged Electron → Vercel. */
export function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
