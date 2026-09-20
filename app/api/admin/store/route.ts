import { NextRequest, NextResponse } from "next/server";
import { getStoreData, saveStoreData, StoreAdminData } from "@/lib/admin-store-service";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  const data = getStoreData();

  if (auth !== data.adminSecret) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  const currentData = getStoreData();

  if (auth !== currentData.adminSecret) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload: Partial<StoreAdminData> = await req.json();
    const updated: StoreAdminData = {
      ...currentData,
      ...payload,
      contact: {
        ...currentData.contact,
        ...(payload.contact || {})
      },
      products: payload.products || currentData.products
    };

    const saved = saveStoreData(updated);
    if (!saved) {
      return NextResponse.json({ success: false, error: "write_error" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "数据已成功保存至持久化存储" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "invalid_payload" }, { status: 400 });
  }
}