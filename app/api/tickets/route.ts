import { NextRequest, NextResponse } from "next/server";
import { getTickets, createTicket, updateTicket } from "@/lib/tickets-service";
import { getStoreData } from "@/lib/admin-store-service";

export async function GET(req: NextRequest) {
  try {
    const adminSecret = req.headers.get("x-admin-secret");
    const storeData = getStoreData();
    const isAdmin = adminSecret && adminSecret === storeData.adminSecret;

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");
    const ticketId = searchParams.get("ticket_id");

    const all = getTickets();

    if (isAdmin) {
      return NextResponse.json({ success: true, tickets: all });
    }

    if (ticketId) {
      const match = all.find((t) => t.id === ticketId);
      return NextResponse.json({ success: true, ticket: match || null });
    }

    if (orderId) {
      const matches = all.filter(
        (t) => t.order_id.toLowerCase() === orderId.toLowerCase()
      );
      return NextResponse.json({ success: true, tickets: matches });
    }

    return NextResponse.json({ success: false, error: "未提供查询凭据" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, category, contact, description } = body;

    if (!order_id || !contact || !description) {
      return NextResponse.json(
        { success: false, error: "请完整填写订单号、联系方式与问题描述" },
        { status: 400 }
      );
    }

    const ticket = createTicket({
      order_id,
      category: category || "general",
      contact,
      description,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminSecret = req.headers.get("x-admin-secret");
    const storeData = getStoreData();

    if (!adminSecret || adminSecret !== storeData.adminSecret) {
      return NextResponse.json({ success: false, error: "无权访问" }, { status: 401 });
    }

    const body = await req.json();
    const { ticket_id, status, reply } = body;

    if (!ticket_id) {
      return NextResponse.json({ success: false, error: "未指定工单号" }, { status: 400 });
    }

    const updated = updateTicket(ticket_id, { status, reply });
    if (!updated) {
      return NextResponse.json({ success: false, error: "工单未找到" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
