export interface ProductInfo {
  id: string;
  name: string;
  badge: string;
  codePrefix: string;
  codeSample: string;
  credentialType: "session" | "oauth";
  priceDesc: string;
  description: string;
  tierLevel: 1 | 2 | 3;
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
  session_data: SessionData;
  confirm_duplicate?: boolean;
}

export interface DuplicateConfirmError {
  success: false;
  error: "duplicate_email_blocked" | "duplicate_email_confirm";
  detail: string;
  detail_zh: string;
  duplicate: true;
  last_product: string;
  last_at: string;
  hours_ago: number;
  need_confirm?: boolean;
}

export type TaskStatus = 
  | "QUEUED"
  | "SESSION_VERIFYING"
  | "TOPUP_DISPATCHING"
  | "SUBSCRIPTION_PROVISIONING"
  | "COMPLETED"
  | "FAILED";

export interface TaskRecord {
  task_id: string;
  card_code_masked: string;
  product_id: string;
  product_name: string;
  target_email: string;
  status: TaskStatus;
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
  error_message?: string;
}