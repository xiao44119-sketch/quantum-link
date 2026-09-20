"use client";

import React, { useState, useEffect } from "react";
import { 
  Lock, 
  Key, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  QrCode,
  ShieldCheck,
  Flame,
  Layers,
  Settings,
  X
} from "lucide-react";
import { StoreProduct } from "@/config/store-products";

export default function AdminPage() {
  const [authKey, setAuthKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [contact, setContact] = useState({
    wechat: "AI-ASSIST-VIP",
    qrNote: "扫码添加客服 / 付款",
    noticeText: "支持充值至您现有的个人自用账号，正规海外实体卡结算，保留历史对话与全部数据，一人一卡安全稳定。"
  });

  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authKey.trim()) return;

    setLoading(true);
    try {
      const resp = await fetch("/api/admin/store", {
        headers: { "x-admin-secret": authKey.trim() },
      });

      const res = await resp.json();
      if (!resp.ok) {
        showToast("error", "管理员口令错误，请重新输入");
        return;
      }

      setIsAuthenticated(true);
      setProducts(res.data.products || []);
      if (res.data.contact) {
        setContact(res.data.contact);
      }
      showToast("success", "控制台身份验证通过");
    } catch (err) {
      showToast("error", "网络连接异常");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (newProducts?: StoreProduct[], newContact?: any) => {
    setSaving(true);
    try {
      const payload = {
        products: newProducts || products,
        contact: newContact || contact,
      };

      const resp = await fetch("/api/admin/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": authKey.trim(),
        },
        body: JSON.stringify(payload),
      });

      const res = await resp.json();
      if (resp.ok) {
        showToast("success", "所有更改已保存，前台已实时同步生效！");
      } else {
        showToast("error", res.error || "保存失败");
      }
    } catch (e) {
      showToast("error", "保存遇到网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm("确认下架并删除该商品吗？")) return;
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    handleSaveAll(updated);
  };

  const handleSaveProductModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let updated: StoreProduct[];
    if (isNewProduct) {
      updated = [...products, editingProduct];
    } else {
      updated = products.map((p) => (p.id === editingProduct.id ? editingProduct : p));
    }

    setProducts(updated);
    setEditingProduct(null);
    handleSaveAll(updated);
  };

  const handleOpenAddProduct = () => {
    setIsNewProduct(true);
    setEditingProduct({
      id: "product_" + Date.now().toString(36),
      title: "新 AI 订阅商品",
      sub: "自备账号 · 独享正规",
      badge: "全新上架",
      price: "168",
      originalPrice: "¥198",
      period: "30天质保",
      prefix: "PH-",
      stockStatus: "极速秒发",
      description: "商品简要介绍说明",
      features: [
        "官方正规代充，独立独享",
        "10秒全自动下发激活",
        "提供 30 天售后质保"
      ],
      isPopular: false,
    });
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-[#f0f7f7] font-mono relative selection:bg-cyan-500/20 selection:text-cyan-200">
      <div className="ambient-glow" />
      <div className="screen-lines" />
      <div className="hud-grid" />

      {/* 提示条 */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
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
      )}

      {/* 门禁登录 */}
      {!isAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-20">
          <div className="w-full max-w-md glass-card corner-bracket p-8 rounded-lg shadow-2xl">
            <div className="text-center space-y-2 mb-7">
              <div className="w-12 h-12 mx-auto rounded-lg border border-cyan-400/40 bg-cyan-950/40 flex items-center justify-center text-[var(--holo)] shadow-[0_0_20px_rgba(0,229,216,0.2)]">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wider uppercase">
                ADMIN CONSOLE GATEWAY
              </h2>
              <p className="text-xs text-[var(--fg-muted)]">
                全息站长管理后台 · 请输入管理口令进入
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-300 block mb-1.5">管理员口令 (DEFAULT: admin888)</label>
                <input
                  type="password"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  placeholder="请输入密钥..."
                  className="w-full bg-black/50 border border-white/10 hover:border-white/20 focus:border-[var(--holo)] rounded-md px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md border border-[var(--holo)] bg-cyan-950/70 hover:bg-cyan-900 text-white text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,216,0.2)]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-[var(--holo)]" /> : <Key className="w-4 h-4 text-[var(--holo)]" />}
                <span>验证身份并进入后台 (ENTER)</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
              <a
                href="/"
                className="text-xs text-[var(--warm)] hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                返回前台主站
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* 管理中心主界面 */
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* 顶栏控制 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 signal-dot" />
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider">
                  QUANTUM LINK · 站长运营中枢
                </h1>
              </div>
              <p className="text-xs text-[var(--fg-muted)] mt-1">
                实时管理前台商品、价格、卡密前缀与收银台客服配置，修改后前台秒级生效。
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full border border-white/10 hover:border-white/30 text-xs text-neutral-300 hover:text-white transition-all inline-flex items-center gap-1.5 bg-white/[0.02]"
              >
                <span>预览前台效果</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => handleSaveAll()}
                disabled={saving}
                className="px-5 py-2 rounded-full border border-[var(--holo)] bg-cyan-950/70 hover:bg-cyan-900 text-white text-xs font-bold tracking-wider inline-flex items-center gap-2 shadow-[0_0_15px_rgba(0,229,216,0.25)] transition-all"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[var(--holo)]" />}
                <span>保存全部修改 (SAVE)</span>
              </button>
            </div>
          </div>

          {/* 收银台与客服配置 */}
          <div className="glass-card corner-bracket p-6 rounded-lg shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-white/[0.08] pb-3">
              <Settings className="w-4 h-4 text-[var(--warm)]" />
              <span>收银台与客服联系方式配置</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1.5">客服微信号 (前台一键复制)</label>
                <input
                  type="text"
                  value={contact.wechat}
                  onChange={(e) => setContact({ ...contact, wechat: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[var(--holo)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1.5">收款码提示文字</label>
                <input
                  type="text"
                  value={contact.qrNote}
                  onChange={(e) => setContact({ ...contact, qrNote: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[var(--holo)] focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-neutral-400 block mb-1.5">商城顶部全局公告说明</label>
                <input
                  type="text"
                  value={contact.noticeText}
                  onChange={(e) => setContact({ ...contact, noticeText: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:border-[var(--holo)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 商品列表 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white tracking-wider">
                  在售商品矩阵 ({products.length} 款)
                </h2>
              </div>

              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="px-4 py-2 rounded-full border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/50 text-[var(--warm)] text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(255,184,133,0.15)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 上架新套餐</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="glass-card corner-bracket p-6 rounded-lg flex flex-col justify-between space-y-4 hover:border-[var(--line-strong)] transition-all shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-white">{prod.title}</h3>
                        <span className="text-xs text-[var(--fg-muted)] block mt-0.5">{prod.sub}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--warm)]/40 bg-amber-950/30 text-[var(--warm)]">
                        {prod.badge}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 my-4 text-xs">
                      <span className="text-3xl font-extrabold text-white">¥ {prod.price}</span>
                      {prod.originalPrice && (
                        <span className="line-through text-neutral-500 text-xs">{prod.originalPrice}</span>
                      )}
                      <span className="text-neutral-400 ml-auto">/ {prod.period}</span>
                    </div>

                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                      {prod.description}
                    </p>

                    <div className="p-3 rounded border border-white/[0.06] bg-black/40 text-[11px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">卡密前缀:</span>
                        <span className="text-[var(--holo)] font-bold">{prod.prefix}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">库存状态:</span>
                        <span className="text-emerald-400 font-medium">● {prod.stockStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewProduct(false);
                        setEditingProduct({ ...prod });
                      }}
                      className="px-3 py-1.5 rounded border border-cyan-400/40 text-cyan-300 hover:bg-cyan-950/40 transition-colors inline-flex items-center gap-1.5 text-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 编辑商品
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 下架删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 编辑弹窗 */}
          {editingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto glass-card corner-bracket p-7 rounded-lg shadow-2xl space-y-5 text-white">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <h3 className="text-base font-bold text-white tracking-wider">
                    {isNewProduct ? "上架新 AI 套餐" : "编辑套餐属性"}
                  </h3>
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="text-neutral-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveProductModal} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-neutral-300 block mb-1">商品标题 (Title)</label>
                      <input
                        type="text"
                        value={editingProduct.title}
                        onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1">副标题 (Sub)</label>
                      <input
                        type="text"
                        value={editingProduct.sub}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sub: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-neutral-300 block mb-1">现售价 (¥)</label>
                      <input
                        type="text"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-[var(--warm)] font-bold text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1">划线原价 (¥)</label>
                      <input
                        type="text"
                        value={editingProduct.originalPrice || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-neutral-400"
                        placeholder="例如: ¥188"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1">有效质保周期</label>
                      <input
                        type="text"
                        value={editingProduct.period}
                        onChange={(e) => setEditingProduct({ ...editingProduct, period: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                        placeholder="30天质保"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-neutral-300 block mb-1">卡密前缀 (Prefix)</label>
                      <input
                        type="text"
                        value={editingProduct.prefix}
                        onChange={(e) => setEditingProduct({ ...editingProduct, prefix: e.target.value.toUpperCase() })}
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-[var(--holo)] font-bold"
                        placeholder="PH-"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1">热卖徽章</label>
                      <input
                        type="text"
                        value={editingProduct.badge}
                        onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                        placeholder="销量冠军"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-300 block mb-1">库存状态标签</label>
                      <select
                        value={editingProduct.stockStatus}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stockStatus: e.target.value as any })}
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                      >
                        <option value="极速秒发">极速秒发</option>
                        <option value="充足现货">充足现货</option>
                        <option value="库存紧张">库存紧张</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-neutral-300 block mb-1">商品简述</label>
                    <textarea
                      rows={2}
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-neutral-300 block mb-1">特权清单 (每行一条特权)</label>
                    <textarea
                      rows={4}
                      value={editingProduct.features.join("\n")}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          features: e.target.value.split("\n").filter((f) => f.trim().length > 0),
                        })
                      }
                      className="w-full bg-black/50 border border-white/10 rounded p-2.5 text-white font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isPopular"
                      checked={editingProduct.isPopular || false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isPopular: e.target.checked })}
                      className="accent-[var(--holo)] rounded"
                    />
                    <label htmlFor="isPopular" className="text-neutral-300">
                      设为前台重点推荐 (带冠军流光边框)
                    </label>
                  </div>

                  <div className="pt-4 border-t border-white/[0.08] flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 rounded border border-neutral-700 text-neutral-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded border border-[var(--holo)] bg-cyan-950/70 hover:bg-cyan-900 text-white font-bold"
                    >
                      保存并应用
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}