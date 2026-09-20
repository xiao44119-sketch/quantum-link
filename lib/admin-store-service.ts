import fs from "fs";
import path from "path";
import { STORE_PRODUCTS, StoreProduct } from "@/config/store-products";

export interface StoreAdminData {
  adminSecret: string;
  contact: {
    wechat: string;
    qrNote: string;
    noticeText: string;
  };
  products: StoreProduct[];
}

const DATA_FILE = path.join(process.cwd(), "data", "store-config.json");

export function getStoreData(): StoreAdminData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Read store data failed, using fallback:", err);
  }

  return {
    adminSecret: "admin888",
    contact: {
      wechat: "AI-ASSIST-VIP",
      qrNote: "扫码添加客服 / 付款",
      noticeText: "支持充值至您现有的个人自用账号，正规海外实体卡结算，保留历史对话与全部数据，一人一卡安全稳定。"
    },
    products: STORE_PRODUCTS
  };
}

export function saveStoreData(data: StoreAdminData): boolean {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Save store data failed:", err);
    return false;
  }
}