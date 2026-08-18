import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ShareRouteContext = {
  params: Promise<{ token: string }>;
};

function unavailable() {
  return new NextResponse("This resume link is unavailable.", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
}

export async function GET(_request: Request, context: ShareRouteContext) {
  try {
    const { token } = await context.params;

    if (!/^[A-Za-z0-9_-]{32,}$/.test(token)) {
      return unavailable();
    }

    const supabase = createAdminClient();
    const { data: shareLink, error } = await supabase
      .from("resume_share_links")
      .select("id,is_active,resume_id")
      .eq("token", token)
      .maybeSingle();

    if (error || !shareLink || shareLink.is_active === false) {
      return unavailable();
    }

    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id,student_id,storage_path,file_name")
      .eq("id", shareLink.resume_id)
      .is("removed_at", null)
      .maybeSingle();

    if (resumeError || !resume?.storage_path || !resume.student_id) {
      return unavailable();
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("profile_id")
      .eq("id", resume.student_id)
      .maybeSingle();

    if (studentError || !student?.profile_id) {
      return unavailable();
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", student.profile_id)
      .maybeSingle();

    if (profileError || profile?.is_active !== true) {
      return unavailable();
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from("resumes")
      .createSignedUrl(resume.storage_path, 60 * 10);

    if (signedError || !signed?.signedUrl) {
      return unavailable();
    }

    await supabase
      .from("resume_share_links")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", shareLink.id);

    return NextResponse.redirect(signed.signedUrl);
  } catch (error) {
    console.error("Resume share link failed", error);
    return unavailable();
  }
}
