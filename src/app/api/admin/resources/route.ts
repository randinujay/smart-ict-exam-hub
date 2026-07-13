import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/server/api-auth";

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const storagePath = String(body.storagePath ?? "").trim();
    const fileName = String(body.fileName ?? "").trim();
    const access = body.access === "free" ? "free" : "paid";
    const moduleId = body.moduleId ? String(body.moduleId) : null;
    if (!title || !storagePath || !fileName) return NextResponse.json({ error: "Missing resource details." }, { status: 400 });
    if (!/^\d{4}\/[0-9a-f-]{36}-[a-z0-9._-]+$/i.test(storagePath)) return NextResponse.json({ error: "Invalid storage path." }, { status: 400 });
    if (access === "paid" && !moduleId) return NextResponse.json({ error: "Paid resources must belong to a monthly module." }, { status: 400 });

    const { data: resource, error } = await auth.supabase.from("resources").insert({
      module_id: moduleId,
      title,
      description: String(body.description ?? "").trim(),
      file_name: fileName,
      storage_path: storagePath,
      file_type: String(body.fileType ?? "Other"),
      access_type: access,
      is_published: Boolean(body.isPublished),
    }).select("id").single();
    if (error || !resource) throw error ?? new Error("Resource was not created.");

    const audiences = (Array.isArray(body.programIds) ? body.programIds : []).map((programId: unknown) => ({
      content_type: "resource",
      content_id: resource.id,
      program_id: String(programId),
    }));
    if (audiences.length) {
      const { error: audienceError } = await auth.supabase.from("content_audiences").insert(audiences);
      if (audienceError) {
        await auth.supabase.from("resources").delete().eq("id", resource.id);
        throw audienceError;
      }
    }
    return NextResponse.json({ id: resource.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create resource." }, { status: 500 });
  }
}
