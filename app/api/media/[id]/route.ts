import { NextRequest, NextResponse } from "next/server";
import { getVaultMedia } from "@/lib/cloud-vault";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const asset = await getVaultMedia(id);

  if (!asset) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const buf = Buffer.from(asset.data_base64, "base64");
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": asset.mime_type || "image/png",
      "Content-Length": String(buf.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
