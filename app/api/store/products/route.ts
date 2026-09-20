import { NextResponse } from "next/server";
import { getStoreData } from "@/lib/admin-store-service";

export async function GET() {
  const data = getStoreData();
  return NextResponse.json({
    success: true,
    contact: data.contact,
    products: data.products,
  });
}