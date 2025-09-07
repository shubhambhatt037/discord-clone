import Pusher from "pusher";
import PusherClient from "pusher-js";

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2047257",
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || "ee69ac52710e02e0e6bd",
  secret: process.env.PUSHER_SECRET || "2537341c8a416d788cf2",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
  useTLS: true,
});

// Client-side Pusher instance - only initialize if we have the key
export const pusherClient = typeof window !== "undefined" 
  ? new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY || "ee69ac52710e02e0e6bd",
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
      }
    )
  : null;