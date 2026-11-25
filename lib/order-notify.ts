import crypto from "crypto";
import nodemailer from "nodemailer";
import { getVaultStoreConfig } from "./cloud-vault";
import { MobileNotifyConfig, RetailOrderRecord } from "./types";

function getSigningSecret(): string {
  const vaultSec = process.env.VAULT_SERVER_SECRET?.trim() || "ql_default_vault_sec";
  const adminSec = process.env.ADMIN_SECRET?.trim() || "admin888";
  return `${vaultSec}::${adminSec}::quantum_approve_v1`;
}

export function signOrderApproveToken(orderId: string, retailTotalFen: number): string {
  const payload = `ql_approve_v1|${orderId}|${retailTotalFen}`;
  return crypto.createHmac("sha256", getSigningSecret()).update(payload).digest("hex");
}

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

function resolveSmtpHost(email: string): { host: string; port: number } {
  const lower = email.toLowerCase();
  if (lower.endsWith("@163.com")) return { host: "smtp.163.com", port: 465 };
  if (lower.endsWith("@126.com")) return { host: "smtp.126.com", port: 465 };
  if (lower.endsWith("@gmail.com")) return { host: "smtp.gmail.com", port: 465 };
  if (lower.endsWith("@feishu.cn")) return { host: "smtp.feishu.cn", port: 465 };
  // 默认支持 @qq.com 与 @foxmail.com（完美触发微信官方「QQ邮箱提醒」弹窗）
  return { host: "smtp.qq.com", port: 465 };
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

  const htmlCard = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;max-width:460px;margin:0 auto;background:#0b0f19;color:#f8fafc;padding:22px;border-radius:18px;border:1px solid rgba(56,189,248,0.25);">
  <div style="font-size:11px;color:#38bdf8;letter-spacing:1.5px;margin-bottom:6px;font-weight:700;">QUANTUMLINK · 收款核销提醒</div>
  <div style="font-size:28px;font-weight:800;color:#34d399;margin-bottom:14px;">¥${params.amountText}</div>
  <div style="background:#131a2a;padding:13px 15px;border-radius:12px;font-size:13px;line-height:1.8;color:#e2e8f0;margin-bottom:18px;">
    ${params.summaryLines.map((l) => `<div>${l}</div>`).join("")}
  </div>
  <a href="${params.approveUrl}" style="display:block;text-align:center;background:#10b981;color:#04130d;font-weight:800;font-size:15px;padding:14px 16px;border-radius:12px;text-decoration:none;">
    👉 核实已到账 · 点此 1 秒自动发卡
  </a>
  <div style="font-size:11px;color:#94a3b8;margin-top:12px;text-align:center;">
    安全提示：请先确认微信/支付宝已收到该笔款项，再点击上方绿色按钮发卡
  </div>
</div>`.trim();

  // 通道 1（首选 0 元免实名）：QQ 邮箱 SMTP -> 微信官方「QQ邮箱提醒」原生秒弹窗
  const qqEmail = notify.qqEmail?.trim();
  const qqSmtpPass = notify.qqSmtpPass?.replace(/\s+/g, "").trim();
  if (qqEmail && qqSmtpPass) {
    tasks.push(
      (async () => {
        const { host, port } = resolveSmtpHost(qqEmail);
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: true,
          auth: {
            user: qqEmail,
            pass: qqSmtpPass,
          },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 10000,
        });

        await transporter.sendMail({
          from: `"骁清算力馆收银台" <${qqEmail}>`,
          to: qqEmail,
          subject: params.title,
          html: htmlCard,
          text: `${params.title}\n${params.summaryLines.join("\n")}\n\n一键免登录发卡链接：${params.approveUrl}`,
        });
        sent.push("QQ邮箱（微信提醒）");
      })().catch((e) => {
        errors.push(`QQ邮箱SMTP: ${e?.message || "连接失败，请检查邮箱地址与16位授权码"}`);
      })
    );
  }

  // 通道 2：群机器人 Webhook（兼容飞书 / 钉钉 / 企业微信）
  const webhookUrl = notify.webhookUrl?.trim();
  if (webhookUrl && webhookUrl.startsWith("http")) {
    tasks.push(
      (async () => {
        const isFeishu = webhookUrl.includes("feishu.cn") || webhookUrl.includes("larksuite.com");
        const payload = isFeishu
          ? {
              msg_type: "interactive",
              card: {
                header: {
                  title: { tag: "plain_text", content: params.title },
                  template: "green",
                },
                elements: [
                  {
                    tag: "div",
                    text: {
                      tag: "lark_md",
                      content: params.summaryLines.join("\n"),
                    },
                  },
                  {
                    tag: "action",
                    actions: [
                      {
                        tag: "button",
                        text: { tag: "plain_text", content: "👉 核实已收款 · 1秒自动发卡" },
                        type: "primary",
                        url: params.approveUrl,
                      },
                    ],
                  },
                ],
              },
            }
          : {
              msgtype: "markdown",
              markdown: {
                title: params.title,
                content: `**${params.title}**\n${params.summaryLines.map((l) => `> ${l}`).join("\n")}\n[👉 点此进入免登一键发卡页](${params.approveUrl})`,
                text: `**${params.title}**\n\n${params.summaryLines.map((l) => `- ${l}`).join("\n")}\n\n[👉 点此进入免登一键发卡页](${params.approveUrl})`,
              },
            };

        const resp = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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

  // 通道 3：可选 PushPlus
  const pushplusToken = notify.pushplusToken?.trim();
  if (pushplusToken) {
    tasks.push(
      (async () => {
        const resp = await fetch("https://www.pushplus.plus/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: pushplusToken,
            title: params.title,
            content: htmlCard,
            template: "html",
          }),
          signal: AbortSignal.timeout(8000),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && (data.code === 200 || data.code === 0)) {
          sent.push("PushPlus");
        } else {
          errors.push(`PushPlus: ${data.msg || resp.status}`);
        }
      })().catch((e) => {
        errors.push(`PushPlus: ${e?.message || "请求超时"}`);
      })
    );
  }

  // 通道 4：可选 Bark / Server酱
  const barkRaw = notify.barkKey?.trim();
  if (barkRaw) {
    tasks.push(
      (async () => {
        const base = barkRaw.startsWith("http")
          ? barkRaw.replace(/\/+$/, "")
          : `https://api.day.app/${encodeURIComponent(barkRaw)}`;
        const resp = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            title: params.title,
            body: `${params.summaryLines.join(" · ")}\n点击通知直接进入 1 秒免登发卡页`,
            group: "QuantumLink收款",
            sound: "paymentsuccess",
            level: "timeSensitive",
            url: params.approveUrl,
          }),
          signal: AbortSignal.timeout(8000),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && (data.code === 200 || data.message === "success")) {
          sent.push("Bark");
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
        const resp = await fetch(`https://sctapi.ftqq.com/${encodeURIComponent(sctKey)}.send`, {
          method: "POST",
          headers: { "Content-Type": "application/json;charset=utf-8" },
          body: JSON.stringify({
            title: params.title,
            desp: `### 待核销 ¥${params.amountText}\n${params.summaryLines.map((l) => `- ${l}`).join("\n")}\n\n### [👉 点此免登一键自动发卡](${params.approveUrl})`,
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

  await Promise.allSettled(tasks);
  return { sent, errors };
}

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
    (notify.qqEmail?.trim() && notify.qqSmtpPass?.trim()) ||
      notify.webhookUrl?.trim() ||
      notify.pushplusToken?.trim() ||
      notify.barkKey?.trim() ||
      notify.serverChanKey?.trim()
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
    title: `💰 收款核销 ¥${amountText} · ${order.product_name}`,
    amountText,
    summaryLines: [
      `商品：${order.product_name}${order.variant ? ` [${order.variant}]` : ""} × ${order.quantity}`,
      `单号：${order.order_id}（本单净赚 +¥${profitText}）`,
      `买家联系：${order.buyer_contact || "未填写"}`,
      `付款备注：${order.payer_note || "买家已点击完成扫码付款"}`,
    ],
    approveUrl,
  });
}

export async function sendTestMobilePush(
  notify: MobileNotifyConfig,
  requestOrigin?: string
): Promise<{ sent: string[]; errors: string[] }> {
  const origin = normalizeOrigin(requestOrigin);
  return dispatchToChannels(notify, {
    title: "🔔 骁清算力馆 · 微信 QQ邮箱提醒已成功打通！",
    amountText: "35.00",
    summaryLines: [
      "恭喜！0 元免实名的手机收款提醒专线已连通",
      "以后顾客扫码点「我已付款」，您的微信会立刻弹出此卡片",
      "点开下方绿色大按钮，1 秒免登录自动调苏哲提卡发货！",
    ],
    approveUrl: `${origin}/admin`,
  });
}
