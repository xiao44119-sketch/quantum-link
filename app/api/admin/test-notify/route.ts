import { NextRequest, NextResponse } from "next/server";
import { getVaultStoreConfig, saveVaultStoreConfig, verifyAdminSecret } from "@/lib/cloud-vault";
import { sendTestMobilePush } from "@/lib/order-notify";

export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminSecret(req.headers.get("x-admin-secret"));
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const notifyPatch = body.notify;

  // 若前端传入了刚填好的 notify 配置，顺便自动保存入库再发测试推送，省去站长漏点保存！
  let notifyCfg = notifyPatch;
  if (notifyPatch && typeof notifyPatch === "object") {
    const saved = await saveVaultStoreConfig({ notify: notifyPatch });
    notifyCfg = saved.notify;
  } else {
    const cfg = await getVaultStoreConfig(true);
    notifyCfg = cfg.notify || {};
  }

  const hasAny = Boolean(
    notifyCfg?.pushplusToken?.trim() ||
      notifyCfg?.barkKey?.trim() ||
      notifyCfg?.serverChanKey?.trim() ||
      notifyCfg?.webhookUrl?.trim()
  );

  if (!hasAny) {
    return NextResponse.json(
      {
        success: false,
        error: "请先在上方任选填入一个推送凭证（如微信 PushPlus Token 或 iPhone Bark Key）",
      },
      { status: 400 }
    );
  }

  const res = await sendTestMobilePush(notifyCfg, req.nextUrl.origin);
  if (res.sent.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: `推送未送达：${res.errors.join("；") || "请检查 Token 是否填写正确"}`,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    sent: res.sent,
    errors: res.errors,
    message: `配置已自动保存，测试消息已送达：${res.sent.join("、")}！快看一眼手机！`,
  });
}
