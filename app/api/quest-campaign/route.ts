import { NextResponse } from "next/server";
import { getQuestCampaignPublicStatus } from "@/app/actions/quest-campaign";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload =
    url.searchParams.get("mode") === "dock"
      ? await getQuestCampaignPublicStatus("dock")
      : await getQuestCampaignPublicStatus("full");
  return NextResponse.json({ quest: payload });
}
