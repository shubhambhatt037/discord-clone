import { NextApiRequest, NextApiResponse } from "next";
import { pusherServer } from "@/lib/pusher";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { channelId, message, type = "new" } = req.body;

    if (!channelId || !message) {
      return res.status(400).json({ error: "Missing channelId or message" });
    }

    // Determine event type
    const eventType = type === "update" ? "message-update" : "new-message";

    // Trigger the message to all subscribers of this channel
    await pusherServer.trigger(
      `channel-${channelId}`,
      eventType,
      message
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Pusher error:", error);
    res.status(500).json({ 
      error: "Failed to send message",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}