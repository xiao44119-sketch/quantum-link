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
  Settings
} from "lucide-react";
import { StoreProduct } from "@/config/store-products";

export default function AdminPage() {
  const [authKey, setAuthKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 后台数据状态
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [contact, setContact] = useState({
    wechat: "AI-ASSIST-VIP",
    qrNote: "扫码添加客服 / 付款",
    noticeText: "支持充值至您现有的个人自用账号，正规海外实体卡结算，保留历史对话与全部数据，一人一卡安全稳定。"
  });

  // 编辑模态框
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  // 消息提示
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 尝试登录并拉取数据
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

  // 保存数据到后端持久化
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

  // 删除商品
  const handleDeleteProduct = (id: string) => {
    if (!confirm("确认下架并删除该商品吗？")) return;
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    handleSaveAll(updated);
  };

  // 保存单个商品编辑
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

  // 打开新增商品
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
    <div className="min-h-screen bg-[#05070a] text-[#eaf8f7] font-mono relative selection:bg-cyan-500/20 selection:text-cyan-200">
      <div className="screen-lines" />
      <div className="hud-grid" />

      {/* 消息提示悬浮条 */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-2 border text-xs shadow-2xl flex items-center gap-2 ${
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

      {/* 尚未登录：身份门禁 */}
      {!isAuthenticated ? (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-20">
          <div className="w-full max-w-md border border-[var(--line-strong)] bg-[#080d16]/95 p-8 corner-bracket shadow-2xl">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 mx-auto border border-[var(--holo)]/40 bg-cyan-950/40 flex items-center justify-center text-[var(--holo)]">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-widest uppercase">
                ADMIN CONSOLE GATEWAY
              </h2>
              <p className="text-xs text-[var(--fg-muted)]">
                全息站长管理后台 · 请输入管理口令进入
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">管理员口令 (DEFAULT: admin888)</label>
                <input
                  type="password"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  placeholder="请输入密钥..."
                  className="w-full bg-black/60 border border-[var(--line)] px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--holo)]"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 border border-[var(--holo)] bg-cyan-950/60 hover:bg-cyan-900 text-white text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-[var(--holo)]" /> : <Key className="w-4 h-4 text-[var(--holo)]" />}
                <span>验证身份并进入后台 (ENTER)</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[var(--line)]/60 text-center">
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
        /* 已登录：管理控制中心 */
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* 顶栏控制条 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 signal-dot" />
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
                className="px-3.5 py-2 border border-[var(--line)] hover:border-white text-xs text-neutral-300 hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                <span>预览前台效果</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => handleSaveAll()}
                disabled={saving}
                className="px-5 py-2 border border-[var(--holo)] bg-cyan-950/60 hover:bg-cyan-900 text-white text-xs font-bold tracking-wider inline-flex items-center gap-2 shadow-lg"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[var(--holo)]" />}
                <span>保存全部修改 (SAVE)</span>
              </button>
            </div>
          </div>

          {/* 模块 1：全局收银与客服设置 */}
          <div className="corner-bracket border border-[var(--line)] bg-[#070b12]/90 p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-[var(--line)] pb-3">
              <Settings className="w-4 h-4 text-[var(--warm)]" />
              <span>收银台与客服联系方式配置</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">客服微信号 (点击可一键复制)</label>
                <input
                  type="text"
                  value={contact.wechat}
                  onChange={(e) => setContact({ ...contact, wechat: e.target.value })}
                  className="w-full bg-black/60 border border-[var(--line)] px-3 py-2 text-white focus:border-[var(--holo)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">收款码提示文字</label>
                <input
                  type="text"
                  value={contact.qrNote}
                  onChange={(e) => setContact({ ...contact, qrNote: e.target.value })}
                  className="w-full bg-black/60 border border-[var(--line)] px-3 py-2 text-white focus:border-[var(--holo)] focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-gray-400 block mb-1">商城顶部全局公告说明</label>
                <input
                  type="text"
                  value={contact.noticeText}
                  onChange={(e) => setContact({ ...contact, noticeText: e.target.value })}
                  className="w-full bg-black/60 border border-[var(--line)] px-3 py-2 text-white focus:border-[var(--holo)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 模块 2：商品列表管理 */}
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
                className="px-3.5 py-1.5 border border-[var(--warm)]/50 bg-amber-950/30 hover:bg-amber-900/50 text-[var(--warm)] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 上架新套餐</span>
              </button>
            </div>

            {/* 商品表格/卡片列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="corner-bracket border border-[var(--line)] bg-[#070c14]/90 p-5 flex flex-col justify-between space-y-4 hover:border-[var(--line-strong)] transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-base font-bold text-white">{prod.title}</h3>
                        <span className="text-[11px] text-[var(--fg-muted)] block">{prod.sub}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 border border-[var(--warm)]/40 bg-amber-950/30 text-[var(--warm)]">
                        {prod.badge}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 my-3 text-xs">
                      <span className="text-2xl font-bold text-white">¥ {prod.price}</span>
                      {prod.originalPrice && (
                        <span className="line-through text-neutral-500">{prod.originalPrice}</span>
                      )}
                      <span className="text-neutral-500 ml-auto">/ {prod.period}</span>
                    </div>

                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mb-3">
                      {prod.description}
                    </p>

                    <div className="p-2 border border-[var(--line)] bg-black/40 text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">卡密前缀:</span>
                        <span className="text-[var(--holo)] font-bold">{prod.prefix}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">库存状态:</span>
                        <span className="text-emerald-400">{prod.stockStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)]/60 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewProduct(false);
                        setEditingProduct({ ...prod });
                      }}
                      className="px-3 py-1 border border-[var(--holo)]/40 text-[var(--holo)] hover:bg-cyan-950/40 transition-colors inline-flex items-center gap-1 text-[11px]"
                    >
                      <Edit3 className="w-3 h-3" /> 编辑商品
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id)}
                      className="text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="w-3 h-3" /> 下架删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 编辑/新增商品抽屉弹窗 */}
          {editingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto border border-[var(--line-strong)] bg-[#090e15] p-6 text-white corner-bracket shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    {isNewProduct ? "上架新 AI 套餐" : "编辑套餐属性"}
                  </h3>
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="text-[var(--fg-muted)] hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveProductModal} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-400 block mb-1">商品标题 (Title)</label>
                      <input
                        type="text"
                        value={editingProduct.title}
                        onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                        className="w-full bg-black/60 border border-[var(--line)] px-3 py-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">副标题 (Sub)</label>
                      <input
                        type="text"
                        value={editingProduct.sub}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sub: e.target.value })}
                        className="w-full bg-black/60 border border-[var(--line)] px-3 py-2 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-gray-400 block mb-1">现售价 (¥)</label>
                      <input
                        type="text"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        className="w-full bg-black/60 border border-[var(--line)] px-3 py-2 text-[var(--warm)] font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">划线原价 (¥)</label>
                      <input
                        type="text"
                        value={editingProduct.originalPrice || ""}
                        onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: e.target.value })}
                        className="w-full bg-black/60 border border-[var(--line)] px-3 py-2 text-neutral-400"
                        placeholder="例如: ¥188"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">有效质保周期</label>
                      <input
                        type="text"
                        value={editingProduct.period}
                        onChange={(e) => setEditingProduct({ ...editingProduct, period: e.target.value })}
                        className="w-full bg-black/60 border border-[var(--line)] px-3 py-2 text-white"
                        placeholder="30天质保"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-gray-400 block mb-1">卡密前缀 (Prefix)</label>
                      <input
                        type="text"
                        value={editingProduct.prefix}
                        onChange={(e) => setEditingProduct({ ...editingProduct, prefix: e.target.value.toUpperCase() })}
                        className="w-full bg-black/60 border border-[var(--line)] px-3 py-2 text-[var(--holo)] font-bold"
                        placeholder="PH-"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">热卖徽章</label>
                      <input
                        type="text"
                        value={editingProduct.badge}
                        onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                        className="w-full bg-black/60 border border-[var(--line)] px-3 py-2 text-white"
                        placeholder="销量冠军"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">库存状态标签</label>
                      <select
                        value={editingProduct.stockStatus}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stockStatus: e.target.value as any })}
                        className="w-full bg-black/60 border border-[var(--line)] px-3 py-2 text-white"
                      >
                        <option value="极速秒发">极速秒发</option>
                        <option value="充足现货">充足现货</option>
                        <option value="库存紧张">库存紧张</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">商品简述</label>
                    <textarea
                      rows={2}
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full bg-black/60 border border-[var(--line)] p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-gray-400 block mb-1">特权清单 (每行一条特权)</label>
                    <textarea
                      rows={4}
                      value={editingProduct.features.join("\n")}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          features: e.target.value.split("\n").filter((f) => f.trim().length > 0),
                        })
                      }
                      className="w-full bg-black/60 border border-[var(--line)] p-2 text-white font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isPopular"
                      checked={editingProduct.isPopular || false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isPopular: e.target.checked })}
                      className="accent-[var(--holo)]"
                    />
                    <label htmlFor="isPopular" className="text-neutral-300">
                      设为前台重点推荐 (带冠军流光边框)
                    </label>
                  </div>

                  <div className="pt-4 border-t border-[var(--line)] flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 border border-neutral-700 text-neutral-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 border border-[var(--holo)] bg-cyan-950/60 hover:bg-cyan-900 text-white font-bold"
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