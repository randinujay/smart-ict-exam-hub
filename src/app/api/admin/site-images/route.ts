import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/server/api-auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function extension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if ("error" in auth) return auth.error;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
    if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG or WebP image." }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Use an image smaller than 8 MB." }, { status: 400 });

    const path = `homepage/${crypto.randomUUID()}.${extension(file)}`;
    const { error } = await auth.supabase.storage.from("site-images").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    const { data } = auth.supabase.storage.from("site-images").getPublicUrl(path);
    return NextResponse.json({ path, url: data.publicUrl }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Image upload failed." }, { status: 500 });
  }
}
