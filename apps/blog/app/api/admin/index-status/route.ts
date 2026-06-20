import { NextResponse } from "next/server";
import { getIndexStatus } from "../../../../lib/assistant/retriever";

export async function GET() {
  const status = getIndexStatus();
  return NextResponse.json(status);
}
