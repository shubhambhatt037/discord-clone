import { NextApiRequest, NextApiResponse } from "next";
import { pusherServer } from "@/lib/pusher";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { channelId, message } = req.body;

    // Trigger the message to all subscribers of this channel
    await pusherServer.trigger(
      `channel-${channelId}`,
      "new-message",
      message
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Pusher error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
}