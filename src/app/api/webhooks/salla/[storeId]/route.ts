import { NextRequest, NextResponse } from "next/server";
import { processSallaWebhook } from "@/lib/webhooks";

export async function POST(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  try {
    const payload = await request.json();
    const result = await processSallaWebhook(storeId, payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Salla webhook error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
  }
}
