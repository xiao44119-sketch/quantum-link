import crypto from "crypto";
import { getVaultStoreConfig } from "./cloud-vault";
import { MobileNotifyConfig, RetailOrderRecord } from "./types";

function getSigningSecret(): string {
  const vaultSec = process.env.VAULT_SERVER_SECRET?.trim() || "ql_default_vault_sec";
  const adminSec = process.env.ADMIN_SECRET?.trim() || "admin888";
  return `${vaultSec}::${adminSec}::quantum_approve_v1`;
}

/**
 * 为指定订单生成防篡改 HMAC-SHA256 手机免登核销签名
 */
export function signOrderApproveToken(orderId: string, retailTotalFen: number): string {
  const payload = `ql_approve_v1|${orderId}|${retailTotalFen}`;
  return crypto.createHmac("sha256", getSigningSecret()).update(payload).digest("hex");
}

/**
 * 常量时间校验手机核销签名，彻底杜绝暴力猜解与伪造
 */
export function verifyOrderApproveToken(
  orderId: string,
  retailTotalFen: number,
  providedSig: string | null | undefined
): boolean {
  if (!providedSig || !/^[a-f0-9]{64}$/i.test(providedSig.trim())) {
    return false;
  }
  const expected = signOrderApproveToken(orderId, retailTotalFen);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(providedSig.trim().toLowerCase(), "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function normalizeOrigin(rawOrigin?: string): string {
  if (rawOrigin && rawOrigin.startsWith("http") && !rawOrigin.includes("localhost")) {
    return rawOrigin.replace(/\/+$/, "");
  }
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://card.finnlink.xyz").replace(/\/+$/, "");
}

async function dispatchToChannels(
  notify: MobileNotifyConfig,
  params: {
    title: string;
    amountText: string;
    summaryLines: string[];
    approveUrl: string;
  }
): Promise<{ sent: string[]; errors: string[] }> {
  const sent: string[] = [];
  const errors: string[] = [];
  const tasks: Array<Promise<void>> = [];

  const pushplusToken = notify.pushplusToken?.trim();
  if (pushplusToken) {
    tasks.push(
      (async () => {
        const htmlContent = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;background:#0b0f19;color:#f8fafc;padding:20px;border-radius:16px;">
  <div style="font-size:12px;color:#38bdf8;letter-spacing:1px;margin-bottom:6px;">QUANTUMLINK · 收款核销提醒</div>
  <div style="font-size:24px;font-weight:800;color:#34d399;margin-bottom:12px;">¥${params.amountText}</div>
  <div style="background:#131a2a;padding:12px 14px;border-radius:12px;font-size:13px;line-height:1.75;color:#cbd5e1;margin-bottom:18px;">
    ${params.summaryLines.map((l) => `<div>${l}</div>`).join("")}
  </div>
  <a href="${params.approveUrl}" style="display:block;text-align:center;background:#10b981;color:#04130d;font-weight:700;font-size:15px;padding:13px 16px;border-radius:12px;text-decoration:none;">
    👉 核实到账 · 点此 1 秒自动发卡
  </a>
  <div style="font-size:11px;color:#64748b;margin-top:10px;text-align:center;">
    安全提示：请先确认微信/支付宝零钱已收到款项再点击发卡
  </div>
</div>`.trim();

        const resp = await fetch("https://www.pushplus.plus/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: pushplusToken,
            title: params.title,
            content: htmlContent,
            template: "html",
          }),
          signal: AbortSignal.timeout(8000),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && (data.code === 200 || data.code === 0)) {
          sent.push("微信 PushPlus");
        } else {
          errors.push(`PushPlus: ${data.msg || resp.status}`);
        }
      })().catch((e) => {
        errors.push(`PushPlus: ${e?.message || "请求超时"}`);
      })
    );
  }

  const barkRaw = notify.barkKey?.trim();
  if (barkRaw) {
    tasks.push(
      (async () => {
        const base = barkRaw.startsWith("http")
          ? barkRaw.replace(/\/+$/, "")
          : `https://api.day.app/${encodeURIComponent(barkRaw)}`;
        const bodyText = `${params.summaryLines.join(" · ")}\n点击通知直接进入 1 秒免登发卡页`;
        const resp = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            title: params.title,
            body: bodyText,
            group: "QuantumLink收款",
            sound: "paymentsuccess",
            level: "timeSensitive",
            url: params.approveUrl,
          }),
          signal: AbortSignal.timeout(8000),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && (data.code === 200 || data.message === "success")) {
          sent.push("iPhone Bark");
        } else {
          errors.push(`Bark: ${data.message || resp.status}`);
        }
      })().catch((e) => {
        errors.push(`Bark: ${e?.message || "请求超时"}`);
      })
    );
  }

  const sctKey = notify.serverChanKey?.trim();
  if (sctKey) {
    tasks.push(
      (async () => {
        const desp = [
          `### 待核销金额：¥${params.amountText}`,
          ...params.summaryLines.map((l) => `- ${l}`),
          "",
          `### [👉 点击此处免登录一键确认并自动发卡](${params.approveUrl})`,
        ].join("\n");
        const resp = await fetch(`https://sctapi.ftqq.com/${encodeURIComponent(sctKey)}.send`, {
          method: "POST",
          headers: { "Content-Type": "application/json;charset=utf-8" },
          body: JSON.stringify({
            title: params.title,
            desp,
          }),
          signal: AbortSignal.timeout(8000),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && data?.code === 0) {
          sent.push("Server酱");
        } else {
          errors.push(`Server酱: ${data?.message || resp.status}`);
        }
      })().catch((e) => {
        errors.push(`Server酱: ${e?.message || "请求超时"}`);
      })
    );
  }

  const webhookUrl = notify.webhookUrl?.trim();
  if (webhookUrl && webhookUrl.startsWith("http")) {
    tasks.push(
      (async () => {
        const mdText = [
          `**${params.title}**`,
          ...params.summaryLines.map((l) => `> ${l}`),
          `[👉 点击进入手机免登一键发卡页](${params.approveUrl})`,
        ].join("\n");
        const resp = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            msgtype: "markdown",
            markdown: { content: mdText, text: mdText, title: params.title },
            text: { content: `${params.title}\n${params.summaryLines.join("\n")}\n核销发卡: ${params.approveUrl}` },
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (resp.ok) {
          sent.push("群机器人 Webhook");
        } else {
          errors.push(`Webhook: HTTP ${resp.status}`);
        }
      })().catch((e) => {
        errors.push(`Webhook: ${e?.message || "请求超时"}`);
      })
    );
  }

  await Promise.allSettled(tasks);
  return { sent, errors };
}

/**
 * 顾客点击「我已完成扫码付款」后，自动向站长手机发送带免登一键发卡链接的强提醒
 */
export async function sendOrderAwaitingConfirmPush(
  order: RetailOrderRecord,
  requestOrigin?: string
): Promise<{ sent: string[]; errors: string[] }> {
  const cfg = await getVaultStoreConfig();
  const notify = cfg.notify;
  if (!notify || notify.enabled === false) {
    return { sent: [], errors: [] };
  }

  const hasAnyChannel = Boolean(
    notify.pushplusToken?.trim() ||
      notify.barkKey?.trim() ||
      notify.serverChanKey?.trim() ||
      notify.webhookUrl?.trim()
  );
  if (!hasAnyChannel) {
    return { sent: [], errors: [] };
  }

  const origin = normalizeOrigin(requestOrigin);
  const sig = signOrderApproveToken(order.order_id, order.retail_total_fen);
  const approveUrl = `${origin}/approve/${encodeURIComponent(order.order_id)}?sig=${sig}`;
  const amountText = (order.retail_total_fen / 100).toFixed(2);
  const profitText = (
    ((order.retail_total_fen || 0) - (order.wholesale_total_fen || 0)) /
    100
  ).toFixed(2);

  return dispatchToChannels(notify, {
    title: `💰 待核销 ¥${amountText} · ${order.product_name}`,
    amountText,
    summaryLines: [
      `商品：${order.product_name}${order.variant ? ` [${order.variant}]` : ""} × ${order.quantity}`,
      `单号：${order.order_id}（预计毛利 +¥${profitText}）`,
      `买家预留：${order.buyer_contact || "未填"}`,
      `付款备注：${order.payer_note || "买家已点击扫码完成"}`,
    ],
    approveUrl,
  });
}

/**
 * 后台一键测试手机推送连通性
 */
export async function sendTestMobilePush(
  notify: MobileNotifyConfig,
  requestOrigin?: string
): Promise<{ sent: string[]; errors: string[] }> {
  const origin = normalizeOrigin(requestOrigin);
  return dispatchToChannels(notify, {
    title: "🔔 QuantumLink 手机秒级发卡通道已连通！",
    amountText: "35.00",
    summaryLines: [
      "这是一条来自「骁清 FINN · 数字算力馆」的测试推送",
      "后续买家扫码点击「我已付款」时，您将立刻收到此类卡片",
      "点开底部绿色按钮即可 1 秒免登录自动调苏哲发卡！",
    ],
    approveUrl: `${origin}/admin`,
  });
}
