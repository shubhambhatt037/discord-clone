import { NextApiRequest, NextApiResponse } from "next";
import { pusherServer } from "@/lib/pusher";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { socket_id, channel_name } = req.body;

    if (!socket_id || !channel_name) {
      return res.status(400).json({ error: "Missing socket_id or channel_name" });
    }

    // You can add authentication logic here
    // For now, we'll allow all connections
    const auth = pusherServer.authenticate(socket_id, channel_name);
    
    res.send(auth);
  } catch (error) {
    console.error("Pusher auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}