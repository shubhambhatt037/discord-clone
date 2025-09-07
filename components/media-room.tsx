"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { Channel } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

interface MediaRoomProps {
  chatId: string;
  video: boolean;
  audio: boolean;
};

export const MediaRoom = ({
  chatId,
  video,
  audio
}: MediaRoomProps) => {
  const { user } = useUser();
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!user?.firstName || !user?.lastName) return;

    const name = `${user.firstName} ${user.lastName}`;

    (async () => {
      try {
        console.log("Fetching LiveKit token for:", { room: chatId, username: name });
        const resp = await fetch(`/api/livekit?room=${chatId}&username=${name}`);
        const data = await resp.json();
        console.log("LiveKit response:", data);
        
        if (data.error) {
          console.error("LiveKit error:", data.error);
          return;
        }
        
        setToken(data.token);
        console.log("LiveKit token set successfully");
      } catch (e) {
        console.error("LiveKit fetch error:", e);
      }
    })()
  }, [user?.firstName, user?.lastName, chatId]);

  if (token === "") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2
          className="h-7 w-7 text-zinc-500 animate-spin my-4"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Loading...
        </p>
      </div>
    )
  }

  return (
    <LiveKitRoom
      data-lk-theme="default"
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token}
      connect={true}
      video={video}
      audio={audio}
      onConnected={() => console.log("LiveKit connected successfully")}
      onDisconnected={() => console.log("LiveKit disconnected")}
      onError={(error) => console.error("LiveKit error:", error)}
    >
      <VideoConference />
    </LiveKitRoom>
  )
}