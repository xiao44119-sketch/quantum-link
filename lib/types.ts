export type ActivationLine =
  | "chatgpt"
  | "grok"
  | "sheerid"
  | "gemini_pro"
  | "codex_sms"
  | "tg_premium"
  | "muse_boost";

export interface ProductInfo {
  id: string;
  line: ActivationLine;
  name: string;
  badge: string;
  codePrefix: string;
  codeSample: string;
  credentialType: "session" | "grok_cookie" | "sheerid_url" | "google_2fa" | "sms_console" | "tg_username" | "muse_invite";
  priceDesc: string;
  description: string;
  tierLevel: 1 | 2 | 3;
}

export interface ProductVariant {
  value: string;
  label: string;
  stock: number;
}

export interface StoreProduct {
  id: string; // Maps to SuZhe `product` code (e.g. gpt_plus_ch2, sheerid_student_verify_15)
  title: string;
  sub: string;
  badge: string;
  price: string; // CNY decimal string e.g. "140" or "35.00"
  retailPriceFen?: number;
  wholesalePrice?: string;
  wholesalePriceFen?: number;
  originalPrice?: string;
  period: string;
  prefix: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  enabled?: boolean;
  available?: boolean;
  stock?: number;
  stockStatus: "充足现货" | "库存紧张" | "极速秒发" | "暂时缺货";
  category?: "flagship" | "verify" | "account";
  requiresActivation?: boolean;
  requiresTerms?: boolean;
  activationLine?: ActivationLine | "none";
  deliveryType?: string;
  deliveryLabel?: string;
  variants?: ProductVariant[];
  sortOrder?: number;
}

export interface DeliveredItem {
  type: "cdk" | "account" | "link" | "text" | "card" | "virtual_card" | "api_key" | string;
  title: string;
  value: string;
  copy_text?: string;
  href?: string | null;
  guide?: string;
  fields?: Record<string, string>;
}

export interface RetailOrderRecord {
  order_id: string;
  suzhe_request_id: string;
  suzhe_order_id?: string | null;
  product_code: string;
  product_name: string;
  variant: string;
  quantity: number;
  retail_unit_fen: number;
  retail_total_fen: number;
  wholesale_unit_fen: number;
  wholesale_total_fen: number;
  profit_fen?: number;
  payment_method: "manual_qr" | "epay_alipay" | "epay_wxpay" | "sandbox_demo";
  payment_status: "pending" | "awaiting_confirm" | "paid" | "expired" | "refunded";
  fulfillment_status: "unfulfilled" | "processing" | "delivered" | "failed" | "manual_delivered";
  buyer_contact?: string | null;
  payer_note?: string | null;
  requires_activation: boolean;
  activation_line: ActivationLine | "none";
  delivered_items: DeliveredItem[];
  error_detail?: string | null;
  expires_at: string;
  paid_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductOverrideConfig {
  enabled?: boolean;
  retailPriceFen?: number;
  title?: string;
  sub?: string;
  badge?: string;
  originalPrice?: string;
  period?: string;
  isPopular?: boolean;
  sortOrder?: number;
}

export interface StoreContact {
  wechat: string;
  qrCodeImage?: string;
  alipayQrImage?: string;
  wechatGroupQr?: string;
  wechatGroupTitle?: string;
  wechatGroupNote?: string;
  qqGroup?: string;
  qqGroupUrl?: string;
  telegramChannel?: string;
  telegramGroup?: string;
  email?: string;
  qrNote: string;
  noticeText: string;
  handlingFeePercent?: number;
  handlingFeeMin?: number;
}

export interface EPayConfig {
  url?: string;
  pid?: string;
  key?: string;
}

export interface MobileNotifyConfig {
  enabled?: boolean;
  pushplusToken?: string;
  barkKey?: string;
  serverChanKey?: string;
  webhookUrl?: string;
}

export interface VaultStoreConfig {
  adminSecret: string;
  suzheApiKey?: string; // Optional override for aisub_
  suzheOrderKey?: string; // Optional override for szb_
  paymentMode: "manual_qr" | "epay_auto";
  sandboxDemoEnabled: boolean;
  globalMarkupPercent: number;
  minProfitFen: number;
  contact: StoreContact;
  epay?: EPayConfig;
  notify?: MobileNotifyConfig;
  productOverrides: Record<string, ProductOverrideConfig>;
}

export interface SessionUserData {
  email?: string;
  name?: string;
  picture?: string;
  id?: string;
}

export interface SessionData {
  accessToken: string;
  user?: SessionUserData;
  expires?: string;
  [key: string]: unknown;
}

export interface RedeemRequest {
  card_code: string;
  line?: ActivationLine;
  // ChatGPT
  session_data?: SessionData | unknown;
  confirm_duplicate?: boolean;
  // Grok
  grok_cookies?: unknown;
  // SheerID Student Verify
  sheerid_url?: string;
  // Gemini Pro 3-month
  google_email?: string;
  google_password?: string;
  google_twofa?: string;
  recovery_email?: string;
  // Telegram Premium
  tg_username?: string;
  // Muse Invite Boost
  invite_code?: string;
  uses?: number;
  // Codex SMS
  sms_action?: "get_number" | "resend" | "cancel" | "finish";
  sms_activation_id?: number;
}

export interface DuplicateConfirmError {
  success: false;
  error: "duplicate_email_blocked" | "duplicate_email_confirm";
  detail: string;
  detail_zh: string;
  duplicate: true;
  last_product: string;
  last_product_zh?: string;
  last_at: string;
  hours_ago: number;
  need_confirm?: boolean;
  blocked?: boolean;
}

export type TaskStatus =
  | "QUEUED"
  | "SESSION_VERIFYING"
  | "TOPUP_DISPATCHING"
  | "SUBSCRIPTION_PROVISIONING"
  | "ACTION_REQUIRED"
  | "WAITING_SMS"
  | "CODE_RECEIVED"
  | "COMPLETED"
  | "FAILED";

export interface SmsActivationState {
  id: number;
  status: string;
  country_en?: string;
  dial_code?: string;
  local?: string;
  code?: string | null;
  codes?: string[];
  sms_text?: string | null;
  seconds_left?: number;
  cancel_in?: number;
  can_cancel?: boolean;
  can_resend?: boolean;
  can_finish?: boolean;
  numbers_left?: number;
  card_state?: string;
  refunded?: boolean;
  reason?: string;
}

export interface TaskRecord {
  task_id: string;
  line: ActivationLine;
  card_code_masked: string;
  product_id: string;
  product_name: string;
  target_email: string;
  status: TaskStatus;
  upstream_status?: string;
  progress: number;
  finished: boolean;
  success: boolean;
  created_at: string;
  updated_at: string;
  log_trace: Array<{
    timestamp: string;
    level: "INFO" | "SUCCESS" | "WARN" | "ERROR";
    message: string;
  }>;
  error_code?: string;
  error_message?: string;
  disposal_hint?: string;
  can_retry?: boolean;
  forbid_resubmit?: boolean;
  action_required?: "manual_captcha" | "bank_verification" | string | null;
  verification_url?: string | null;
  verification_expires_at?: number | null;
  redirect_url?: string | null;
  sms_state?: SmsActivationState | null;
  extra_data?: Record<string, unknown>;
}
