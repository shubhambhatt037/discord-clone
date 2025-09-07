"use client";

import * as z from "zod";
import axios from "axios";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal-store";
import { EmojiPicker } from "@/components/emoji-picker";

interface ChatInputProps {
  apiUrl: string;
  query: Record<string, any>;
  name: string;
  type: "conversation" | "channel";
}

const formSchema = z.object({
  content: z.string().min(1),
});

export const ChatInput = ({
  apiUrl,
  query,
  name,
  type,
}: ChatInputProps) => {
  const { onOpen } = useModal();
  const router = useRouter();
  
  // Temporarily disable socket for Vercel compatibility
  // TODO: Replace with Pusher implementation
  const [showCommands, setShowCommands] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    }
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: apiUrl,
        query,
      });

      // Send message to database
      const response = await axios.post(url, values);

      // Trigger Pusher for real-time updates
      if (response.data) {
        try {
          console.log("Triggering Pusher event for new message:", {
            channelId: query.channelId || query.conversationId,
            messageId: response.data.id
          });
          
          await axios.post("/api/pusher/messages", {
            channelId: query.channelId || query.conversationId,
            message: response.data
          });
          
          console.log("Pusher event triggered successfully");
        } catch (pusherError) {
          console.log("Pusher error (non-critical):", pusherError);
        }
      }

      form.reset();
      router.refresh();
    } catch (error) {
      console.log("Error sending message:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative p-4 pb-6">
                  <button
                    type="button"
                    onClick={() => onOpen("messageFile", { apiUrl, query })}
                    className="absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center"
                  >
                    <Plus className="text-white dark:text-[#313338]" />
                  </button>
                  <Input
                    disabled={isLoading}
                    className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                    placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setShowCommands(e.target.value.startsWith('/'));
                    }}
                  />
                  {showCommands && field.value.startsWith('/') && (
                    <div className="absolute top-full left-4 right-4 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-50">
                      <div className="p-2">
                        <div 
                          className="flex items-center gap-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded cursor-pointer"
                          onClick={() => {
                            field.onChange('/summarize ');
                            setShowCommands(false);
                          }}
                        >
                          <Bot className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium text-sm">/summarize [count]</div>
                            <div className="text-xs text-zinc-500">Generate AI summary of recent messages</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-7 right-8">
                    <EmojiPicker
                      onChange={(emoji: string) => field.onChange(`${field.value} ${emoji}`)}
                    />
                  </div>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}