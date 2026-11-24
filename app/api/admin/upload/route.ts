import { NextRequest, NextResponse } from "next/server";
import { saveVaultMedia, verifyAdminSecret } from "@/lib/cloud-vault";

export async function POST(req: NextRequest) {
  try {
    const adminSecret = req.headers.get("x-admin-secret");
    if (!(await verifyAdminSecret(adminSecret))) {
      return NextResponse.json({ error: "管理员口令验证未通过" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未检测到上传的图片文件" }, { status: 400 });
    }

    const mime = file.type;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowed.includes(mime)) {
      return NextResponse.json({ error: "仅支持上传 JPG、PNG、WEBP、GIF、SVG 格式图片" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength > 4.5 * 1024 * 1024) {
      return NextResponse.json({ error: "二维码图片大小请控制在 4.5MB 以内" }, { status: 413 });
    }

    const id = `qr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const url = await saveVaultMedia({
      id,
      mime_type: mime,
      data_base64: buffer.toString("base64"),
      byte_size: buffer.byteLength,
    });

    return NextResponse.json({ success: true, url, id });
  } catch (err: any) {
    console.error("Cloud Vault upload failed:", err);
    return NextResponse.json({ error: err.message || "上传云存储失败" }, { status: 500 });
  }
}
