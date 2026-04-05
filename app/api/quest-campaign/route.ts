import { NextResponse } from "next/server";
import { getQuestCampaignPublicStatus } from "@/app/actions/quest-campaign";

export async function GET() {
  const payload = await getQuestCampaignPublicStatus();
  return NextResponse.json({ quest: payload });
}
