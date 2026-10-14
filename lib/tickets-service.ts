import fs from "fs";
import path from "path";

export interface Ticket {
  id: string;
  order_id: string;
  category: "409_conflict" | "card_invalid" | "subscription_dropped" | "general";
  category_name: string;
  contact: string;
  description: string;
  status: "pending" | "processing" | "resolved";
  created_at: string;
  reply?: string;
  replied_at?: string;
}

const TICKETS_FILE = path.join(process.cwd(), "data", "tickets.json");

export function getTickets(): Ticket[] {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const content = fs.readFileSync(TICKETS_FILE, "utf8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Failed to read tickets:", err);
  }
  return [];
}

export function saveTickets(tickets: Ticket[]): boolean {
  try {
    const dir = path.dirname(TICKETS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Failed to save tickets:", err);
    return false;
  }
}

export function createTicket(data: {
  order_id: string;
  category: "409_conflict" | "card_invalid" | "subscription_dropped" | "general";
  contact: string;
  description: string;
}): Ticket {
  const tickets = getTickets();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ticketId = `TK-${dateStr}-${randomHex}`;

  const categoryNames: Record<string, string> = {
    "409_conflict": "409 冲突 / 账号充值报错",
    "card_invalid": "卡密无效 / 提示未找到",
    "subscription_dropped": "掉订阅 / 申请质保补发",
    "general": "其他对账与操作咨询",
  };

  const newTicket: Ticket = {
    id: ticketId,
    order_id: data.order_id.trim(),
    category: data.category,
    category_name: categoryNames[data.category] || "其他咨询",
    contact: data.contact.trim(),
    description: data.description.trim(),
    status: "pending",
    created_at: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false }),
  };

  tickets.unshift(newTicket);
  saveTickets(tickets);
  return newTicket;
}

export function updateTicket(
  ticketId: string,
  update: { status?: "pending" | "processing" | "resolved"; reply?: string }
): Ticket | null {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === ticketId);
  if (idx === -1) return null;

  if (update.status) tickets[idx].status = update.status;
  if (update.reply !== undefined) {
    tickets[idx].reply = update.reply;
    tickets[idx].replied_at = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
  }

  saveTickets(tickets);
  return tickets[idx];
}
