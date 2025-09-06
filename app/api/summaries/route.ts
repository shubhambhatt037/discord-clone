import { NextResponse } from "next/server";
import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    // Verify user has access to the channel
    const channel = await db.channel.findFirst({
      where: {
        id: channelId,
        server: {
          members: {
            some: {
              profileId: profile.id
            }
          }
        }
      }
    });

    if (!channel) {
      return new NextResponse("Channel not found", { status: 404 });
    }

    const summaries = await db.summary.findMany({
      where: {
        channelId: channelId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Last 10 summaries
    });

    return NextResponse.json(summaries);
  } catch (error) {
    console.log("[SUMMARIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}