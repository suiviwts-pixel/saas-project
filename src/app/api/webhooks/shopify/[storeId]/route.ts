import { NextRequest, NextResponse } from "next/server";
import { processShopifyWebhook } from "@/lib/webhooks";

export async function POST(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  try {
    const payload = await request.json();
    const topic = request.headers.get("x-shopify-topic") ?? undefined;
    const result = await processShopifyWebhook(storeId, payload, topic);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Shopify webhook error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
