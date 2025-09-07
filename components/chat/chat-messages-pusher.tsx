"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher";
import { Member, Message, Profile } from "@prisma/client";

type MessageWithMemberWithProfile = Message & {
  member: Member & {
    profile: Profile;
  };
};

interface ChatMessagesPusherProps {
  channelId: string;
  initialMessages: MessageWithMemberWithProfile[];
}

export const ChatMessagesPusher = ({
  channelId,
  initialMessages
}: ChatMessagesPusherProps) => {
  const [messages, setMessages] = useState<MessageWithMemberWithProfile[]>(initialMessages);

  useEffect(() => {
    // Subscribe to the channel
    const channel = pusherClient.subscribe(`channel-${channelId}`);

    // Listen for new messages
    channel.bind("new-message", (newMessage: MessageWithMemberWithProfile) => {
      setMessages((current) => [...current, newMessage]);
    });

    // Listen for message updates
    channel.bind("message-update", (updatedMessage: MessageWithMemberWithProfile) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === updatedMessage.id ? updatedMessage : message
        )
      );
    });

    // Listen for message deletions
    channel.bind("message-delete", (deletedMessage: { id: string }) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === deletedMessage.id
            ? { ...message, deleted: true }
            : message
        )
      );
    });

    // Cleanup on unmount
    return () => {
      pusherClient.unsubscribe(`channel-${channelId}`);
    };
  }, [channelId]);

  return (
    <div className="flex-1 flex flex-col py-4 overflow-y-auto">
      {messages.map((message) => (
        <div key={message.id} className="flex items-start gap-x-2 p-4">
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-x-2">
              <p className="font-semibold text-sm hover:underline cursor-pointer">
                {message.member.profile.name}
              </p>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {new Date(message.createdAt).toLocaleString()}
              </span>
            </div>
            <p className={`text-sm ${message.deleted ? "italic text-zinc-500" : ""}`}>
              {message.deleted ? "This message has been deleted." : message.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};