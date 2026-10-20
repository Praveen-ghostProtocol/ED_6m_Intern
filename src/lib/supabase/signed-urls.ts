import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getSignedUrlMap(
  supabase: SupabaseServerClient,
  bucket: string,
  paths: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const uniquePaths = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  const urls = new Map<string, string>();

  for (let start = 0; start < uniquePaths.length; start += 100) {
    const { data } = await supabase.storage.from(bucket).createSignedUrls(uniquePaths.slice(start, start + 100), 60 * 10);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl);
    }
  }

  return urls;
}
