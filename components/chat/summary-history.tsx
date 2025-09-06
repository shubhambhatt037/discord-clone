"use client";

import { useState, useEffect } from "react";
import { Summary } from "@prisma/client";
import { Bot, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import axios from "axios";

interface SummaryHistoryProps {
  channelId: string;
}

export const SummaryHistory = ({ channelId }: SummaryHistoryProps) => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchSummaries = async () => {
    if (summaries.length > 0) return; // Already loaded
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/summaries?channelId=${channelId}`);
      setSummaries(response.data);
    } catch (error) {
      console.error("Failed to fetch summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSummaries();
    }
  }, [isOpen]);

  if (summaries.length === 0 && !loading) {
    return null; // Don't show if no summaries exist
  }

  return (
    <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            <Bot className="h-4 w-4" />
            <span>AI Summaries ({summaries.length})</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          {loading ? (
            <div className="text-sm text-zinc-500 text-center py-2">
              Loading summaries...
            </div>
          ) : (
            summaries.map((summary) => (
              <div
                key={summary.id}
                className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3"
              >
                <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(summary.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                  <MessageSquare className="h-3 w-3 ml-2" />
                  <span>{summary.messageCount} messages</span>
                </div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {summary.content}
                </div>
              </div>
            ))
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};