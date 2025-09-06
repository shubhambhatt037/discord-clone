import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { ensureAIBotInServer, getAIBotMember } from "@/lib/ai-bot";
import { generateSummary } from "@/lib/ai-service";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfilePages(req);
    const { messageCount = 50 } = req.body;
    const { serverId, channelId } = req.query;
    
    if (!profile) {
      return res.status(401).json({ error: "Unauthorized" });
    }    
  
    if (!serverId) {
      return res.status(400).json({ error: "Server ID missing" });
    }
      
    if (!channelId) {
      return res.status(400).json({ error: "Channel ID missing" });
    }

    // Validate message count
    const count = Math.min(Math.max(parseInt(messageCount) || 50, 10), 200);

    // Verify user has access to the server
    const server = await db.server.findFirst({
      where: {
        id: serverId as string,
        members: {
          some: {
            profileId: profile.id
          }
        }
      },
      include: {
        members: true,
      }
    });

    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }

    // Verify channel exists
    const channel = await db.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: serverId as string,
      }
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Ensure AI bot exists in this server
    await ensureAIBotInServer(serverId as string);
    const botMember = await getAIBotMember(serverId as string);

    if (!botMember) {
      return res.status(500).json({ message: "Failed to create AI bot" });
    }

    // Send loading message first
    const loadingMessage = await db.message.create({
      data: {
        content: "🤖 AIBot is analyzing the conversation and generating a summary...",
        channelId: channelId as string,
        memberId: botMember.id,
      },
      include: {
        member: {
          include: {
            profile: true,
          }
        }
      }
    });

    const channelKey = `chat:${channelId}:messages`;
    res?.socket?.server?.io?.emit(channelKey, loadingMessage);

    // Fetch recent messages for summarization
    const messages = await db.message.findMany({
      take: count,
      where: {
        channelId: channelId as string,
        deleted: false,
      },
      include: {
        member: {
          include: {
            profile: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      }
    });

    // Generate summary
    const summaryContent = await generateSummary(messages, channel.name);

    // Create summary record
    await db.summary.create({
      data: {
        content: summaryContent,
        channelId: channelId as string,
        messageCount: messages.length,
      }
    });

    // Update the loading message with the actual summary
    const summaryMessage = await db.message.update({
      where: { id: loadingMessage.id },
      data: {
        content: `📋 **Channel Summary** (Last ${messages.length} messages)\n\n${summaryContent}`,
      },
      include: {
        member: {
          include: {
            profile: true,
          }
        }
      }
    });

    // Emit the updated message
    res?.socket?.server?.io?.emit(channelKey, summaryMessage);

    return res.status(200).json(summaryMessage);
  } catch (error) {
    console.log("[SUMMARIZE_POST]", error);
    return res.status(500).json({ message: "Internal Error" }); 
  }
}