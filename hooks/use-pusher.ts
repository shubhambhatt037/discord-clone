import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher";
import { Channel } from "pusher-js";

export const usePusher = (channelId: string) => {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to the channel
    const pusherChannel = pusherClient.subscribe(`channel-${channelId}`);
    setChannel(pusherChannel);

    // Connection state handlers
    pusherClient.connection.bind("connected", () => {
      setIsConnected(true);
    });

    pusherClient.connection.bind("disconnected", () => {
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      pusherClient.unsubscribe(`channel-${channelId}`);
      setChannel(null);
    };
  }, [channelId]);

  return { channel, isConnected };
};