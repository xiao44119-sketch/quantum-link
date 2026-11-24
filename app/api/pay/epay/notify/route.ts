import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getVaultStoreConfig } from "@/lib/cloud-vault";
import { fulfillOrderViaSuZhe } from "@/lib/suzhe-order-service";

function verifyEpaySign(params: Record<string, string>, secretKey: string): boolean {
  const receivedSign = params.sign || "";
  if (!receivedSign || !secretKey) return false;

  const sortedPairs = Object.keys(params)
    .filter((k) => k !== "sign" && k !== "sign_type" && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const expected = crypto
    .createHash("md5")
    .update(sortedPairs + secretKey, "utf8")
    .digest("hex");

  return expected.toLowerCase() === receivedSign.toLowerCase();
}

async function handleCallback(params: Record<string, string>) {
  const cfg = await getVaultStoreConfig();
  const epayKey = process.env.EPAY_KEY || cfg.epay?.key || "";
  if (!epayKey) {
    return new NextResponse("fail: epay not configured", { status: 400 });
  }

  if (!verifyEpaySign(params, epayKey)) {
    return new NextResponse("fail: invalid signature", { status: 403 });
  }

  if (params.trade_status === "TRADE_SUCCESS") {
    const orderId = params.out_trade_no;
    if (orderId) {
      await fulfillOrderViaSuZhe(orderId);
    }
  }

  return new NextResponse("success", { status: 200 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const map: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    map[k] = v;
  });
  return handleCallback(map);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const map: Record<string, string> = {};
  if (formData) {
    formData.forEach((v, k) => {
      map[k] = String(v);
    });
  }
  return handleCallback(map);
}
