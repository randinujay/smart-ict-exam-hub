import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/server/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { resourceId } = await params;
  const { data: allowed, error: accessError } = await auth.supabase.rpc("can_access_resource", {
    p_resource_id: resourceId,
  });

  if (accessError || !allowed) {
    return NextResponse.json({ error: "You do not have access to this resource." }, { status: 403 });
  }

  const { data: resource, error: resourceError } = await auth.supabase
    .from("resources")
    .select("storage_path,file_name")
    .eq("id", resourceId)
    .single();

  if (resourceError || !resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const { data, error } = await auth.supabase.storage
    .from("resources")
    .createSignedUrl(resource.storage_path, 60, { download: resource.file_name });

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Could not prepare the download." }, { status: 500 });
  }

  return NextResponse.redirect(new URL(data.signedUrl, request.url));
}
