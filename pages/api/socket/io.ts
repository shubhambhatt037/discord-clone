import { NextApiRequest, NextApiResponse } from "next";

// Socket.IO is disabled - using Pusher for real-time features
// This endpoint returns 404 to stop connection attempts

const ioHandler = (req: NextApiRequest, res: NextApiResponse) => {
  res.status(404).json({ 
    error: "Socket.IO disabled - using Pusher for real-time features",
    pusher: "Real-time features now powered by Pusher"
  });
}

export default ioHandler;