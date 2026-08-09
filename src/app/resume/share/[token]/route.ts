import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ShareRouteContext = {
  params: Promise<{ token: string }>;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function unavailable() {
  return new NextResponse("This resume link is unavailable.", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

export async function GET(_request: Request, context: ShareRouteContext) {
  const { token } = await context.params;

  if (!/^[A-Za-z0-9_-]{32,}$/.test(token)) {
    return unavailable();
  }

  const supabase = createAdminClient();
  const { data: shareLink, error } = await supabase
    .from("resume_share_links")
    .select("id,is_active,resumes(storage_path,file_name)")
    .eq("token", token)
    .maybeSingle();

  if (error || !shareLink || shareLink.is_active === false) {
    return unavailable();
  }

  const resume = one(shareLink.resumes) as Record<string, unknown> | null;
  const storagePath = resume?.storage_path as string | null | undefined;

  if (!storagePath) {
    return unavailable();
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("resumes")
    .createSignedUrl(storagePath, 60 * 10);

  if (signedError || !signed?.signedUrl) {
    return unavailable();
  }

  await supabase
    .from("resume_share_links")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("id", shareLink.id);

  return NextResponse.redirect(signed.signedUrl);
}