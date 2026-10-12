import { NextRequest, NextResponse } from "next/server";
import { processShippingWebhook } from "@/lib/webhooks";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; storeId: string }> },
) {
  const { provider, storeId } = await params;
  try {
    const payload = await request.json();
    const result = await processShippingWebhook(provider, storeId, payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Shipping webhook error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
