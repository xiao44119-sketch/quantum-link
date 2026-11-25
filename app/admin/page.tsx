"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Lock,
  Key,
  Save,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Flame,
  Settings,
  Upload,
  Headphones,
  Copy,
  Check,
  RefreshCw,
  ShoppingBag,
  Layers,
  Wallet,
  Send,
  Search,
  Star,
} from "lucide-react";
import {
  ProductOverrideConfig,
  RetailOrderRecord,
  StoreProduct,
} from "@/lib/types";

type AdminTab = "ORDERS" | "CATALOG" | "TICKETS" | "SETTINGS";

export default function AdminPage() {
  const [authKey, setAuthKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("ORDERS");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<
    "qrCodeImage" | "alipayQrImage" | "wechatGroupQr" | null
  >(null);

  // Store & Catalog State
  const [cloudVaultActive, setCloudVaultActive] = useState(true);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [productOverrides, setProductOverrides] = useState<Record<string, ProductOverrideConfig>>({});
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<"ENABLED" | "INSTOCK" | "ALL">("ENABLED");
  const [globalMarkupPercent, setGlobalMarkupPercent] = useState(22);
  const [minProfitFen, setMinProfitFen] = useState(300);
  const [paymentMode, setPaymentMode] = useState<"manual_qr" | "epay_auto">("manual_qr");
  const [sandboxDemoEnabled, setSandboxDemoEnabled] = useState(false);

  const [contact, setContact] = useState<any>({
    wechat: "18300425760",
    wechatGroupTitle: "Finn 极客 AI 交流群",
    qqGroup: "837192045",
    telegramChannel: "https://t.me/finn_vibe_link",
    qrNote: "微信 / 支付宝扫码付款",
    noticeText: "",
  });
  const [epay, setEpay] = useState<any>({ url: "", pid: "", key: "" });
  const [notify, setNotify] = useState<any>({
    enabled: true,
    qqEmail: "",
    qqSmtpPass: "",
    pushplusToken: "",
    barkKey: "",
    serverChanKey: "",
    webhookUrl: "",
  });
  const [testingNotify, setTestingNotify] = useState(false);
  const [suzheApiKey, setSuzheApiKey] = useState("");
  const [suzheOrderKey, setSuzheOrderKey] = useState("");
  const [hasEnvActivationKey, setHasEnvActivationKey] = useState(false);
  const [hasEnvOrderKey, setHasEnvOrderKey] = useState(false);

  // Orders, Ledger & Tickets State
  const [orders, setOrders] = useState<RetailOrderRecord[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>("ALL");
  const [fulfillingOrderId, setFulfillingOrderId] = useState<string | null>(null);
  const [manualDeliverOpenId, setManualDeliverOpenId] = useState<string | null>(null);
  const [manualDeliverText, setManualDeliverText] = useState("");

  const [ledger, setLedger] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketFilter, setTicketFilter] = useState<"ALL" | "pending" | "resolved">("ALL");

  const [testingPing, setTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchOrders = useCallback(async (secret?: string) => {
    const s = (secret || authKey).trim();
    if (!s) return;
    try {
      const resp = await fetch("/api/checkout/orders?limit=100", {
        headers: { "x-admin-secret": s },
      });
      const d = await resp.json();
      if (d.success && Array.isArray(d.orders)) {
        setOrders(d.orders);
      }
    } catch {}
  }, [authKey]);

  const fetchLedger = useCallback(async (secret?: string) => {
    const s = (secret || authKey).trim();
    if (!s) return;
    try {
      const resp = await fetch("/api/checkout/ledger", {
        headers: { "x-admin-secret": s },
      });
      if (resp.ok) {
        const d = await resp.json();
        setLedger(d);
      }
    } catch {}
  }, [authKey]);

  const fetchTickets = useCallback(async (secret?: string) => {
    const s = (secret || authKey).trim();
    if (!s) return;
    try {
      const resp = await fetch("/api/tickets", {
        headers: { "x-admin-secret": s },
      });
      const d = await resp.json();
      if (d.success && Array.isArray(d.tickets)) {
        setTickets(d.tickets);
      }
    } catch {}
  }, [authKey]);

  const fetchStoreAdmin = useCallback(
    async (secret?: string, forceRefresh = false) => {
      const s = (secret || authKey).trim();
      const resp = await fetch(`/api/admin/store${forceRefresh ? "?refresh=1" : ""}`, {
        headers: { "x-admin-secret": s },
      });
      const res = await resp.json();
      if (!resp.ok || !res.success) {
        throw new Error(res.error || "unauthorized");
      }
      setCloudVaultActive(Boolean(res.cloudVaultActive));
      setProducts(res.data.products || []);
      setProductOverrides(res.data.productOverrides || {});
      setPaymentMode(res.data.paymentMode || "manual_qr");
      setSandboxDemoEnabled(Boolean(res.data.sandboxDemoEnabled));
      setGlobalMarkupPercent(res.data.globalMarkupPercent ?? 22);
      setMinProfitFen(res.data.minProfitFen ?? 300);
      if (res.data.contact) setContact(res.data.contact);
      if (res.data.epay) setEpay(res.data.epay);
      if (res.data.notify) setNotify((prev: any) => ({ ...prev, ...res.data.notify }));
      setHasEnvActivationKey(Boolean(res.data.hasEnvActivationKey));
      setHasEnvOrderKey(Boolean(res.data.hasEnvOrderKey));
      setSuzheApiKey(res.data.suzheApiKey || "");
      setSuzheOrderKey(res.data.suzheOrderKey || "");
    },
    [authKey]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authKey.trim()) return;
    setLoading(true);
    try {
      await fetchStoreAdmin(authKey.trim(), false);
      setIsAuthenticated(true);
      await Promise.all([
        fetchOrders(authKey.trim()),
        fetchLedger(authKey.trim()),
        fetchTickets(authKey.trim()),
      ]);
      showToast("success", "身份验证通过 · 已接入云端保险柜");
    } catch {
      showToast("error", "管理员安全口令不正确，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 已登录时每 8 秒静默刷新待核销订单
  useEffect(() => {
    if (!isAuthenticated) return;
    const t = setInterval(() => {
      fetchOrders();
    }, 8000);
    return () => clearInterval(t);
  }, [isAuthenticated, fetchOrders]);

  const handleSaveAll = async (nextOverrides?: Record<string, ProductOverrideConfig>) => {
    setSaving(true);
    try {
      const payload = {
        paymentMode,
        sandboxDemoEnabled,
        globalMarkupPercent,
        minProfitFen,
        contact,
        epay,
        notify,
        suzheApiKey: suzheApiKey.trim(),
        suzheOrderKey: suzheOrderKey.trim(),
        productOverrides: nextOverrides ?? productOverrides,
      };
      const resp = await fetch("/api/admin/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": authKey.trim(),
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        if (data.products) setProducts(data.products);
        showToast("success", data.message || "全部更改已写入云端保险柜并实时生效！");
      } else {
        showToast("error", data.error || "保存失败");
      }
    } catch {
      showToast("error", "保存遇到网络错误");
    } finally {
      setSaving(false);
    }
  };

  const updateProductField = (productCode: string, patch: Partial<ProductOverrideConfig>) => {
    setProductOverrides((prev) => {
      const next = {
        ...prev,
        [productCode]: {
          ...(prev[productCode] || {}),
          ...patch,
        },
      };
      return next;
    });
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productCode) return p;
        const retailFen =
          patch.retailPriceFen !== undefined ? patch.retailPriceFen : p.retailPriceFen;
        return {
          ...p,
          enabled: patch.enabled !== undefined ? patch.enabled : p.enabled,
          isPopular: patch.isPopular !== undefined ? patch.isPopular : p.isPopular,
          title: patch.title !== undefined ? patch.title : p.title,
          badge: patch.badge !== undefined ? patch.badge : p.badge,
          retailPriceFen: retailFen,
          price: retailFen !== undefined ? (retailFen / 100).toFixed(2) : p.price,
        };
      })
    );
  };

  const handleFulfillOrder = async (
    orderId: string,
    action: "confirm_and_fulfill_suzhe" | "manual_deliver" | "close" | "mark_refunded"
  ) => {
    setFulfillingOrderId(orderId);
    try {
      const resp = await fetch(`/api/checkout/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": authKey.trim(),
        },
        body: JSON.stringify({
          action,
          manual_content: action === "manual_deliver" ? manualDeliverText : undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        showToast("error", data.detail || data.error || "操作未成功");
      } else {
        showToast("success", data.message || "订单状态已更新！");
        setManualDeliverOpenId(null);
        setManualDeliverText("");
      }
      await Promise.all([fetchOrders(), fetchLedger()]);
    } catch {
      showToast("error", "请求异常，请重试");
    } finally {
      setFulfillingOrderId(null);
    }
  };

  const handleUploadQr = async (
    field: "qrCodeImage" | "alipayQrImage" | "wechatGroupQr",
    file: File
  ) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const resp = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-secret": authKey.trim() },
        body: formData,
      });
      const res = await resp.json();
      if (resp.ok && res.url) {
        const nextContact = { ...contact, [field]: res.url };
        setContact(nextContact);
        await fetch("/api/admin/store", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-secret": authKey.trim(),
          },
          body: JSON.stringify({ contact: nextContact }),
        }).catch(() => {});
        showToast("success", "二维码已存入云端保险柜并自动绑定生效！");
      } else {
        showToast("error", res.error || "上传失败");
      }
    } catch (e: any) {
      showToast("error", "上传异常: " + e.message);
    } finally {
      setUploadingField(null);
    }
  };

  const handleTestMobileNotify = async () => {
    setTestingNotify(true);
    try {
      const resp = await fetch("/api/admin/test-notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": authKey.trim(),
        },
        body: JSON.stringify({ notify }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        showToast("success", data.message || "测试推送已送达手机！");
      } else {
        showToast("error", data.error || "测试推送未成功");
      }
    } catch {
      showToast("error", "网络请求失败，请重试");
    } finally {
      setTestingNotify(false);
    }
  };

  const handleTestPing = async () => {
    setTestingPing(true);
    setPingResult(null);
    try {
      const resp = await fetch("/api/checkout/ping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": authKey.trim(),
        },
        body: JSON.stringify({
          apiKey: suzheApiKey.trim() || undefined,
          orderKey: suzheOrderKey.trim() || undefined,
        }),
      });
      const data = await resp.json();
      setPingResult(data);
      if (data.success) {
        showToast("success", `连通正常！代理余额: ¥${data.balance ?? "0.00"}`);
        fetchLedger();
      } else {
        showToast("error", data.error || "密钥检测未通过");
      }
    } catch {
      showToast("error", "检测请求失败");
    } finally {
      setTestingPing(false);
    }
  };

  const handleUpdateTicket = async (
    ticketId: string,
    status: "pending" | "processing" | "resolved"
  ) => {
    try {
      const resp = await fetch("/api/tickets", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": authKey.trim(),
        },
        body: JSON.stringify({ ticket_id: ticketId, status }),
      });
      const d = await resp.json();
      if (d.success) {
        showToast("success", "工单状态已更新");
        fetchTickets();
      }
    } catch {
      showToast("error", "更新工单失败");
    }
  };

  const awaitingCount = orders.filter((o) => o.payment_status === "awaiting_confirm").length;
  const pendingTicketCount = tickets.filter((t) => t.status === "pending").length;

  const displayedCatalog = products.filter((p) => {
    if (catalogFilter === "ENABLED" && !p.enabled) return false;
    if (catalogFilter === "INSTOCK" && !p.available) return false;
    if (catalogSearch.trim()) {
      const q = catalogSearch.trim().toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.prefix.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#06090e] text-[#f0f7f7] font-mono relative selection:bg-cyan-500/20 selection:text-cyan-200">
      <div className="ambient-glow" />
      <div className="screen-lines" />
      <div className="hud-grid" />

      {toastMsg ? (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in duration-200">
          <div
            className={`px-4 py-2.5 rounded-full border text-xs shadow-2xl flex items-center gap-2 backdrop-blur-md ${
              toastMsg.type === "success"
                ? "border-emerald-500/80 bg-emerald-950/90 text-emerald-300"
                : "border-rose-500/80 bg-rose-950/90 text-rose-300"
            }`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      ) : null}

      {!isAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-20">
          <div className="w-full max-w-md glass-card corner-bracket p-8 rounded-lg shadow-2xl">
            <div className="text-center space-y-2 mb-7">
              <div className="w-12 h-12 mx-auto rounded-lg border border-cyan-400/40 bg-cyan-950/40 flex items-center justify-center text-[var(--holo)]">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wider uppercase">
                QUANTUMLINK V2 · 站长中枢
              </h2>
              <p className="text-xs text-[var(--fg-muted)]">
                连接 Supabase 云端保险柜 · 手机端随时确认收款秒发真卡
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-300 block mb-1.5">
                  管理员安全口令 (ADMIN SECRET)
                </label>
                <input
                  type="password"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  placeholder="请输入管理员口令..."
                  className="w-full bg-black/50 border border-white/10 focus:border-[var(--holo)] rounded-md px-4 py-3 text-sm text-white focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md border border-[var(--holo)] bg-cyan-950/70 hover:bg-cyan-900 text-white text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                <span>验证身份进入中枢</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
              <a
                href="/"
                className="text-xs text-[var(--warm)] hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回前台商城</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
          {/* 顶栏 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 signal-dot" />
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-wider">
                  QUANTUM LINK V2 · 站长运营中枢
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  {cloudVaultActive ? "Supabase 保险柜已挂载" : "本地模式"}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                苏哲双密钥 (szb_ 拿货 + aisub_ 激活) 全链路打通 · Vercel 重启永不丢数据
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full border border-white/15 hover:border-white/30 text-xs text-neutral-200 inline-flex items-center gap-1.5 bg-white/[0.03]"
              >
                <span>预览前台</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => handleSaveAll()}
                disabled={saving}
                className="px-5 py-2 rounded-full border border-[var(--holo)] bg-cyan-950/80 hover:bg-cyan-900 text-white text-xs font-bold inline-flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,216,0.25)] cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[var(--holo)]" />}
                <span>保存全部修改</span>
              </button>
            </div>
          </div>

          {/* 顶部核心经营指标条 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-black/50 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-neutral-400 block">苏哲代理下单余额 (szb_)</span>
                <span className="text-lg sm:text-xl font-extrabold text-cyan-300">
                  ¥{ledger?.suzhe_balance ?? "0.00"}
                </span>
              </div>
              <a
                href="https://suzhe.ai/agent#wallet"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 text-[10px] font-bold"
              >
                去充值 →
              </a>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/30">
              <span className="text-[10px] text-neutral-400 block">待确认收款发卡</span>
              <span className="text-lg sm:text-xl font-extrabold text-amber-300">
                {awaitingCount} 笔
              </span>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/10">
              <span className="text-[10px] text-neutral-400 block">累计已成交营收</span>
              <span className="text-lg sm:text-xl font-extrabold text-white">
                ¥{ledger?.total_revenue ?? "0.00"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-emerald-500/30">
              <span className="text-[10px] text-neutral-400 block">累计净赚毛利</span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-400">
                +¥{ledger?.total_profit ?? "0.00"}
              </span>
            </div>
          </div>

          {/* 四大工作台切换胶囊 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              {
                id: "ORDERS" as AdminTab,
                icon: ShoppingBag,
                label: "收款核销与一键发卡",
                badge: awaitingCount > 0 ? String(awaitingCount) : null,
              },
              {
                id: "CATALOG" as AdminTab,
                icon: Layers,
                label: `苏哲商品库同步与改价 (${products.length})`,
                badge: null,
              },
              {
                id: "TICKETS" as AdminTab,
                icon: Headphones,
                label: "售后工单中心",
                badge: pendingTicketCount > 0 ? String(pendingTicketCount) : null,
              },
              {
                id: "SETTINGS" as AdminTab,
                icon: Settings,
                label: "收款二维码与密钥设置",
                badge: null,
              },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer border transition-all ${
                    active
                      ? "bg-cyan-950 text-white border-cyan-400/70 shadow-lg"
                      : "bg-white/[0.02] text-neutral-400 hover:text-white border-white/10"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.label}</span>
                  {t.badge ? (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                      {t.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* ==================== TAB 1: 订单核销与自动调苏哲出卡 ==================== */}
          {activeTab === "ORDERS" ? (
            <div className="glass-card corner-bracket p-5 sm:p-6 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    零售订单核销台（点确认即自动调用 szb_ 扣苏哲余额发真卡）
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    核对微信/支付宝到账后点击【确认收款自动发卡】，买家弹窗会自动秒跳卡密。
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(["ALL", "awaiting_confirm", "paid", "pending"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1 rounded-full text-[11px] border cursor-pointer ${
                        orderFilter === st
                          ? "bg-cyan-950 text-cyan-200 border-cyan-400/50 font-bold"
                          : "border-white/10 text-neutral-400"
                      }`}
                    >
                      {st === "ALL"
                        ? "全部"
                        : st === "awaiting_confirm"
                        ? "待核销"
                        : st === "paid"
                        ? "已发卡"
                        : "待付款"}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => fetchOrders()}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer"
                    title="刷新订单"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs">
                  暂无订单记录，前台买家下单后将实时同步至此
                </div>
              ) : (
                <div className="space-y-3">
                  {orders
                    .filter((o) => orderFilter === "ALL" || o.payment_status === orderFilter)
                    .map((o) => {
                      const profitYuan = (
                        ((o.retail_total_fen || 0) - (o.wholesale_total_fen || 0)) /
                        100
                      ).toFixed(2);
                      const isDelivered =
                        (o.fulfillment_status === "delivered" ||
                          o.fulfillment_status === "manual_delivered") &&
                        o.delivered_items?.length > 0;

                      return (
                        <div
                          key={o.order_id}
                          className={`p-4 rounded-xl border space-y-3 ${
                            o.payment_status === "awaiting_confirm"
                              ? "border-amber-400/60 bg-amber-950/15"
                              : "border-white/10 bg-black/50"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-cyan-300">{o.order_id}</span>
                              <span className="text-white font-bold">
                                {o.product_name} {o.variant ? `[${o.variant}]` : ""} × {o.quantity}
                              </span>
                              <span className="text-neutral-500 text-[10px]">
                                {new Date(o.created_at).toLocaleString("zh-CN", { hour12: false })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-amber-300 font-bold">
                                实收 ¥{(o.retail_total_fen / 100).toFixed(2)}
                              </span>
                              <span className="text-neutral-400 text-[11px]">
                                (成本 ¥{(o.wholesale_total_fen / 100).toFixed(2)} · 净赚 +¥{profitYuan})
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                            <div>
                              <span className="text-neutral-500">买家预留联系: </span>
                              <span className="text-cyan-200 font-bold">{o.buyer_contact || "未填写"}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500">付款备注/状态: </span>
                              <span className="text-amber-200">
                                {o.payer_note || o.payment_status}
                              </span>
                            </div>
                          </div>

                          {o.error_detail ? (
                            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-200 text-[11px]">
                              {o.error_detail}
                            </div>
                          ) : null}

                          {isDelivered ? (
                            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] flex items-center justify-between gap-2">
                              <span className="text-emerald-300 truncate">
                                ✅ 已发卡:{" "}
                                {o.delivered_items
                                  .map((i) => i.copy_text || i.value)
                                  .join(" | ")}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(
                                    o.delivered_items.map((i) => i.copy_text || i.value).join("\n"),
                                    `ord_${o.order_id}`
                                  )
                                }
                                className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-200 flex-shrink-0"
                              >
                                {copiedKey === `ord_${o.order_id}` ? "已复制" : "复制交付物"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                disabled={fulfillingOrderId === o.order_id}
                                onClick={() =>
                                  handleFulfillOrder(o.order_id, "confirm_and_fulfill_suzhe")
                                }
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {fulfillingOrderId === o.order_id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                <span>确认已收款 · 自动调苏哲秒发真卡</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setManualDeliverOpenId(
                                    manualDeliverOpenId === o.order_id ? null : o.order_id
                                  )
                                }
                                className="px-3 py-2 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-200 text-xs cursor-pointer"
                              >
                                手动粘贴卡密发货
                              </button>

                              <button
                                type="button"
                                onClick={() => handleFulfillOrder(o.order_id, "close")}
                                className="px-3 py-2 rounded-lg border border-white/10 text-neutral-400 hover:text-rose-300 text-xs ml-auto cursor-pointer"
                              >
                                关闭未付单
                              </button>
                            </div>
                          )}

                          {manualDeliverOpenId === o.order_id ? (
                            <div className="pt-2 space-y-2 border-t border-white/10">
                              <textarea
                                rows={2}
                                value={manualDeliverText}
                                onChange={(e) => setManualDeliverText(e.target.value)}
                                placeholder="粘贴您要手动发给买家的卡密或账号信息（多张可换行）..."
                                className="w-full bg-black/70 border border-white/15 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleFulfillOrder(o.order_id, "manual_deliver")}
                                className="px-4 py-1.5 rounded-lg bg-amber-400 text-black font-bold text-xs cursor-pointer"
                              >
                                立即发送给买家
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : null}

          {/* ==================== TAB 2: 苏哲 43 款商品同步与改价台 ==================== */}
          {activeTab === "CATALOG" ? (
            <div className="glass-card corner-bracket p-5 sm:p-6 rounded-xl space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    苏哲全量供应链实时同步与改价中心（共 {products.length} 款）
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    勾选开关即可上下架任意苏哲商品，调整零售价后点击右上角【保存全部修改】实时同步前台。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await fetchStoreAdmin(authKey.trim(), true);
                    showToast("success", "已从苏哲实时同步最新库存与代理成本价！");
                  }}
                  className="px-3.5 py-2 rounded-lg border border-cyan-400/40 bg-cyan-950/40 text-cyan-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer self-start"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>强制刷新苏哲库存</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {(["ENABLED", "INSTOCK", "ALL"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setCatalogFilter(f)}
                      className={`px-3 py-1.5 rounded-full border cursor-pointer ${
                        catalogFilter === f
                          ? "bg-cyan-950 text-cyan-200 border-cyan-400/50 font-bold"
                          : "border-white/10 text-neutral-400"
                      }`}
                    >
                      {f === "ENABLED"
                        ? `当前上架 (${products.filter((p) => p.enabled).length})`
                        : f === "INSTOCK"
                        ? `苏哲有货 (${products.filter((p) => p.available).length})`
                        : `全部商品 (${products.length})`}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="搜索商品名或代码..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                {displayedCatalog.map((p) => {
                  const costFen = p.wholesalePriceFen ?? 0;
                  const retailFen = p.retailPriceFen ?? Math.round(parseFloat(p.price) * 100);
                  const marginFen = retailFen - costFen;
                  const isLoss = retailFen <= costFen;

                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-xl border grid grid-cols-1 lg:grid-cols-12 gap-3 items-center text-xs ${
                        p.enabled
                          ? "border-white/15 bg-black/50"
                          : "border-white/5 bg-black/25 opacity-65"
                      }`}
                    >
                      {/* 上架开关与商品标题 */}
                      <div className="lg:col-span-5 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={Boolean(p.enabled)}
                          onChange={(e) =>
                            updateProductField(p.id, { enabled: e.target.checked })
                          }
                          className="w-4 h-4 accent-cyan-400 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) =>
                              updateProductField(p.id, { title: e.target.value })
                            }
                            className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-cyan-400 text-white font-bold focus:outline-none py-0.5"
                          />
                          <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                            <span>代码: {p.id}</span>
                            <span>·</span>
                            <span className={p.available ? "text-emerald-400" : "text-rose-400"}>
                              库存: {p.stock ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 成本价 */}
                      <div className="lg:col-span-2 text-neutral-300">
                        <span className="text-[10px] text-neutral-500 block">苏哲拿货价</span>
                        <span className="font-bold">¥{(costFen / 100).toFixed(2)}</span>
                      </div>

                      {/* 零售价编辑 */}
                      <div className="lg:col-span-3">
                        <span className="text-[10px] text-neutral-500 block">本站零售价 (¥)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={(retailFen / 100).toFixed(2)}
                          onChange={(e) => {
                            const val = Math.max(0, Math.round(parseFloat(e.target.value || "0") * 100));
                            updateProductField(p.id, { retailPriceFen: val });
                          }}
                          className="w-28 bg-black/70 border border-white/15 focus:border-cyan-400 rounded px-2.5 py-1 text-white font-bold focus:outline-none"
                        />
                      </div>

                      {/* 单件毛利与爆款星标 */}
                      <div className="lg:col-span-2 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-neutral-500 block">单件净利</span>
                          <span
                            className={`font-bold ${
                              isLoss ? "text-rose-400" : "text-emerald-400"
                            }`}
                          >
                            {marginFen >= 0 ? "+" : ""}¥{(marginFen / 100).toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            updateProductField(p.id, { isPopular: !p.isPopular })
                          }
                          className={`p-1.5 rounded-lg border cursor-pointer ${
                            p.isPopular
                              ? "border-amber-400/60 bg-amber-500/20 text-amber-300"
                              : "border-white/10 text-neutral-500"
                          }`}
                          title="设为热门主推"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* ==================== TAB 3: 售后工单中心 ==================== */}
          {activeTab === "TICKETS" ? (
            <div className="glass-card corner-bracket p-5 sm:p-6 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  售后工单处理中心（数据持久存储于 Supabase）
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  {(["ALL", "pending", "resolved"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setTicketFilter(tab)}
                      className={`px-3 py-1 rounded-full border cursor-pointer ${
                        ticketFilter === tab
                          ? "bg-purple-950 text-purple-200 border-purple-400/50 font-bold"
                          : "border-white/10 text-neutral-400"
                      }`}
                    >
                      {tab === "ALL" ? "全部" : tab === "pending" ? "待处理" : "已解决"}
                    </button>
                  ))}
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-10 text-neutral-500 text-xs">暂无售后工单</div>
              ) : (
                <div className="space-y-3">
                  {tickets
                    .filter((t) =>
                      ticketFilter === "ALL"
                        ? true
                        : ticketFilter === "pending"
                        ? t.status !== "resolved"
                        : t.status === "resolved"
                    )
                    .map((t) => {
                      const tid = t.ticket_id || t.id;
                      return (
                        <div
                          key={tid}
                          className="p-4 rounded-xl border border-white/10 bg-black/50 space-y-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-cyan-300">{tid}</span>
                              <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[10px]">
                                {t.category_name}
                              </span>
                            </div>
                            <span className="text-[11px] text-amber-300">{t.status}</span>
                          </div>
                          <div className="text-[11px] text-neutral-300">
                            关联单号/任务: <strong className="text-white">{t.order_id}</strong> · 客户联系:{" "}
                            <strong className="text-cyan-300">{t.contact}</strong>{" "}
                            <button
                              type="button"
                              onClick={() => handleCopy(t.contact, tid)}
                              className="text-purple-300 underline ml-1"
                            >
                              {copiedKey === tid ? <Check className="w-3 h-3 inline" /> : "复制"}
                            </button>
                          </div>
                          <p className="p-2.5 rounded bg-black/40 border border-white/5 text-neutral-200 whitespace-pre-wrap">
                            {t.description}
                          </p>
                          {t.status !== "resolved" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateTicket(tid, "resolved")}
                                className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] cursor-pointer"
                              >
                                标记已解决
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : null}

          {/* ==================== TAB 4: 双密钥检测与永久收款二维码配置 ==================== */}
          {activeTab === "SETTINGS" ? (
            <div className="space-y-6">
              {/* 方案一：手机微信 / Bark 强提醒 + 免登录 1 秒自动发卡 */}
              <div className="glass-card p-6 rounded-2xl space-y-4 border border-emerald-400/35">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-sm sm:text-base font-bold text-white">
                        📱 方案一：手机秒级收款提醒 + 1 秒免登录自动发卡（0 手续费）
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      顾客扫码点「我已付款」瞬间自动弹窗到你手机，附带专属加密绿色按钮，手机上点一下直接调苏哲秒发卡，无需盯电脑！
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestMobileNotify}
                    disabled={testingNotify}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer self-start flex-shrink-0 shadow-md"
                  >
                    {testingNotify ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>保存并发送测试消息到手机</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-2 p-4 rounded-xl bg-emerald-950/20 border border-emerald-400/35 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-emerald-300 text-xs sm:text-sm">
                        ★ 首选真·0元免实名方案：QQ 邮箱 + 微信自带「QQ邮箱提醒」（安卓/苹果原生微信秒弹窗）
                      </span>
                      <a
                        href="https://wx.mail.qq.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-300 hover:underline inline-flex items-center gap-0.5 text-[11px]"
                      >
                        打开 QQ 邮箱网页版拿 16 位授权码 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      ① 微信里搜<strong>「QQ邮箱提醒」</strong>点启用（腾讯官方免费，无需掏 3.9 元认证费、无需给小平台传身份证）；② 登录 <code className="text-sky-300">wx.mail.qq.com</code> → 设置 → 账号 → 开启 <strong>POP3/SMTP 服务</strong>，复制生成的 <strong>16 位字母授权码</strong>（注意不是 QQ 登录密码）填到右侧即可！
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="email"
                        value={notify.qqEmail || ""}
                        onChange={(e) =>
                          setNotify({ ...notify, enabled: true, qqEmail: e.target.value })
                        }
                        placeholder="您的 QQ 邮箱，如 12345678@qq.com"
                        className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2.5 text-white font-mono"
                      />
                      <input
                        type="password"
                        value={notify.qqSmtpPass || ""}
                        onChange={(e) =>
                          setNotify({ ...notify, enabled: true, qqSmtpPass: e.target.value })
                        }
                        placeholder="16 位 QQ 邮箱 SMTP 授权码（非QQ密码）"
                        className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-neutral-300 font-semibold block mb-1">
                      备选 0 元方案：飞书 / 钉钉 / 企业微信群机器人 Webhook
                    </label>
                    <input
                      type="text"
                      value={notify.webhookUrl || ""}
                      onChange={(e) =>
                        setNotify({ ...notify, enabled: true, webhookUrl: e.target.value })
                      }
                      placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1">
                      其他可选：Server酱 SendKey / PushPlus Token
                    </label>
                    <input
                      type="text"
                      value={notify.serverChanKey || notify.pushplusToken || ""}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val.startsWith("SCT")) {
                          setNotify({ ...notify, enabled: true, serverChanKey: val });
                        } else {
                          setNotify({ ...notify, enabled: true, pushplusToken: val });
                        }
                      }}
                      placeholder="可选：SCT... 或其他 Token"
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 苏哲双密钥状态 */}
              <div className="glass-card corner-bracket p-6 rounded-xl space-y-4 border border-cyan-500/30">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">苏哲 AI 双密钥体系连通检测</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestPing}
                    disabled={testingPing}
                    className="px-4 py-1.5 rounded-lg bg-cyan-950 border border-cyan-400/40 text-cyan-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {testingPing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flame className="w-3.5 h-3.5" />}
                    <span>一键检测双密钥与余额</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-neutral-300 block mb-1">
                      激活密钥 (aisub_...) {hasEnvActivationKey ? "· [环境变量已安全注入]" : ""}
                    </label>
                    <input
                      type="password"
                      value={suzheApiKey}
                      onChange={(e) => setSuzheApiKey(e.target.value)}
                      placeholder={hasEnvActivationKey ? "默认使用服务端环境变量 SUZHE_API_KEY" : "输入 aisub_..."}
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 block mb-1">
                      代理下单密钥 (szb_...) {hasEnvOrderKey ? "· [环境变量已安全注入]" : ""}
                    </label>
                    <input
                      type="password"
                      value={suzheOrderKey}
                      onChange={(e) => setSuzheOrderKey(e.target.value)}
                      placeholder={hasEnvOrderKey ? "默认使用服务端环境变量 SUZHE_ORDER_KEY" : "输入 szb_..."}
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>

                {pingResult ? (
                  <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-xs text-emerald-300">
                    激活网关：{pingResult.activation?.success ? `✅ 正常 (${pingResult.client_name})` : "❌ 异常"} ｜ 下单钱包：
                    {pingResult.orderWallet?.success ? `✅ 正常 (实时余额 ¥${pingResult.balance})` : `❌ ${pingResult.orderWallet?.error || "异常"}`}
                  </div>
                ) : null}
              </div>

              {/* 收款码永久云存储上传 */}
              <div className="glass-card corner-bracket p-6 rounded-xl space-y-5">
                <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/[0.08] pb-3">
                  <QrCode className="w-4 h-4 text-cyan-400" />
                  <span>个人收款码与社群二维码（直存 Supabase 云端保险柜，Vercel 永不丢失）</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {(
                    [
                      { field: "qrCodeImage", title: "① 微信个人收款码", desc: "买家结算默认展示" },
                      { field: "alipayQrImage", title: "② 支付宝收款码", desc: "支持双码自由切换" },
                      { field: "wechatGroupQr", title: "③ 微信交流群二维码", desc: "页脚社群引流展示" },
                    ] as const
                  ).map((slot) => (
                    <div
                      key={slot.field}
                      className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">{slot.title}</span>
                          <span className="text-[10px] text-neutral-400">{slot.desc}</span>
                        </div>
                        {contact[slot.field] ? (
                          <button
                            type="button"
                            onClick={() => setContact({ ...contact, [slot.field]: "" })}
                            className="text-rose-400 text-[10px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> 移除
                          </button>
                        ) : null}
                      </div>

                      <div className="w-28 h-28 mx-auto bg-white rounded-xl p-1.5 flex items-center justify-center overflow-hidden">
                        {contact[slot.field] ? (
                          <img
                            src={contact[slot.field]}
                            alt={slot.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <QrCode className="w-8 h-8 text-neutral-300" />
                        )}
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        id={`upload-${slot.field}`}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadQr(slot.field, f);
                        }}
                      />
                      <label
                        htmlFor={`upload-${slot.field}`}
                        className="w-full py-2 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900 text-cyan-200 font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {uploadingField === slot.field ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>上传图片入库</span>
                      </label>
                    </div>
                  ))}
                </div>

                {/* 联系方式、海外外贸独立站联动与沙盒开关 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-3 border-t border-white/[0.08]">
                  <div>
                    <label className="text-neutral-400 block mb-1">国内客服微信号</label>
                    <input
                      type="text"
                      value={contact.wechat || ""}
                      onChange={(e) => setContact({ ...contact, wechat: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">
                      海外英文版 WhatsApp 号码（带国家码，如 8618300425760）
                    </label>
                    <input
                      type="text"
                      value={contact.whatsapp || ""}
                      onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                      placeholder="8618300425760"
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">
                      英文版 (/en) 美金换算汇率（默认 7.12）
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={contact.usdExchangeRate ?? 7.12}
                      onChange={(e) =>
                        setContact({
                          ...contact,
                          usdExchangeRate: parseFloat(e.target.value) || 7.12,
                        })
                      }
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">
                      可选：海外买家 USDT (TRC20) 收款地址
                    </label>
                    <input
                      type="text"
                      value={contact.usdtTrc20 || ""}
                      onChange={(e) => setContact({ ...contact, usdtTrc20: e.target.value })}
                      placeholder="选填：填后英文收银台将直接显示一键复制 USDT 地址"
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">
                      外贸主站联动链接（SEO 双向互链，后续建好外贸站可填）
                    </label>
                    <input
                      type="url"
                      value={contact.externalTradeUrl || ""}
                      onChange={(e) =>
                        setContact({ ...contact, externalTradeUrl: e.target.value })
                      }
                      placeholder="例如 https://trade.finnlink.xyz"
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10">
                    <div>
                      <span className="text-white font-bold block">前台沙盒模拟出码按钮</span>
                      <span className="text-[10px] text-neutral-400">
                        正式对外卖卡时建议保持关闭
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={sandboxDemoEnabled}
                      onChange={(e) => setSandboxDemoEnabled(e.target.checked)}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 预留彩虹易支付自动回调配置 */}
                <div className="pt-4 border-t border-white/[0.08] space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-neutral-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>预留：第三方易支付自动回调秒发接口 (/api/pay/epay/notify)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={epay.url || ""}
                      onChange={(e) => setEpay({ ...epay, url: e.target.value })}
                      placeholder="易支付网关 URL (后续开通再填)"
                      className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                    />
                    <input
                      type="text"
                      value={epay.pid || ""}
                      onChange={(e) => setEpay({ ...epay, pid: e.target.value })}
                      placeholder="商户 PID"
                      className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                    />
                    <input
                      type="password"
                      value={epay.key || ""}
                      onChange={(e) => setEpay({ ...epay, key: e.target.value })}
                      placeholder="商户通信密钥 KEY"
                      className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
