import { NextApiRequest, NextApiResponse } from "next";
import { pusherServer } from "@/lib/pusher";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { socket_id, channel_name } = req.body;

  // You can add authentication logic here
  // For now, we'll allow all connections
  const auth = pusherServer.authenticate(socket_id, channel_name);
  
  res.send(auth);
}