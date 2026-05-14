import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: "Image must be under 2MB" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;

  await connectDB();
  await Admin.findByIdAndUpdate(userId, { avatar: base64 });

  return NextResponse.json({ avatar: base64 });
}
