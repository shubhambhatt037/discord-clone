import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Member, Message, Profile } from "@prisma/client";
import { pusherClient } from "@/lib/pusher";

type ChatSocketProps = {
  addKey: string;
  updateKey: string;
  queryKey: string;
  channelId?: string;
}

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    profile: Profile;
  }
}

export const useChatSocket = ({
  addKey,
  updateKey,
  queryKey,
  channelId
}: ChatSocketProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!channelId || !pusherClient) {
      console.log("Pusher not available:", { channelId, pusherClient: !!pusherClient });
      return;
    }

    console.log("Subscribing to Pusher channel:", `channel-${channelId}`);

    // Subscribe to the Pusher channel
    const channel = pusherClient.subscribe(`channel-${channelId}`);

    // Listen for new messages
    channel.bind("new-message", (message: MessageWithMemberWithProfile) => {
      console.log("Received new message via Pusher:", message);
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [{
              items: [message],
            }]
          }
        }

        const newData = [...oldData.pages];

        newData[0] = {
          ...newData[0],
          items: [
            message,
            ...newData[0].items,
          ]
        };

        return {
          ...oldData,
          pages: newData,
        };
      });
    });

    // Listen for message updates
    channel.bind("message-update", (message: MessageWithMemberWithProfile) => {
      console.log("Received message update via Pusher:", message);
      queryClient.setQueryData([queryKey], (oldData: any) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return oldData;
        }

        const newData = oldData.pages.map((page: any) => {
          return {
            ...page,
            items: page.items.map((item: MessageWithMemberWithProfile) => {
              if (item.id === message.id) {
                return message;
              }
              return item;
            })
          }
        });

        return {
          ...oldData,
          pages: newData,
        }
      })
    });

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe(`channel-${channelId}`);
      }
    }
  }, [queryClient, addKey, queryKey, updateKey, channelId]);
}