import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getStoreData } from "@/lib/admin-store-service";

export async function POST(req: NextRequest) {
  try {
    const adminSecret = req.headers.get("x-admin-secret");
    const currentData = getStoreData();

    if (!adminSecret || adminSecret !== currentData.adminSecret) {
      return NextResponse.json({ error: "口令验证未通过" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未检测到上传的文件" }, { status: 400 });
    }

    const mime = file.type;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(mime)) {
      return NextResponse.json({ error: "仅支持上传 JPG、PNG、WEBP、GIF、SVG 格式图片" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 确保 public/uploads 目录存在
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = file.name.split(".").pop() || "png";
    const filename = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err: any) {
    console.error("Upload failed:", err);
    return NextResponse.json({ error: err.message || "上传失败" }, { status: 500 });
  }
}
