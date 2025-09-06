import { NextApiRequest } from "next";

import { NextApiResponseServerIo } from "@/types";
import { currentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { ensureAIBotInServer, getAIBotMember } from "@/lib/ai-bot";
import { generateSummary } from "@/lib/ai-service";

async function handleSummarizeCommand(
  content: string,
  channelId: string,
  serverId: string,
  channel: any,
  res: NextApiResponseServerIo
) {
  try {
    // Parse the command to get message count
    const parts = content.trim().split(" ");
    const messageCount = parts.length > 1 ? parseInt(parts[1]) || 50 : 50;
    const count = Math.min(Math.max(messageCount, 10), 200);

    // Ensure AI bot exists in this server
    await ensureAIBotInServer(serverId);
    const botMember = await getAIBotMember(serverId);

    if (!botMember) {
      throw new Error("Failed to create AI bot");
    }

    // Send loading message first
    const loadingMessage = await db.message.create({
      data: {
        content: "🤖 AIBot is analyzing the conversation and generating a summary...",
        channelId: channelId,
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

    // Fetch recent messages for summarization (in background)
    setTimeout(async () => {
      try {
        const messages = await db.message.findMany({
          take: count,
          where: {
            channelId: channelId,
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
            channelId: channelId,
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
      } catch (error) {
        console.error("Error generating summary:", error);
        
        // Update with error message
        const errorMessage = await db.message.update({
          where: { id: loadingMessage.id },
          data: {
            content: "❌ Sorry, I couldn't generate a summary at this time. Please try again later.",
          },
          include: {
            member: {
              include: {
                profile: true,
              }
            }
          }
        });

        res?.socket?.server?.io?.emit(channelKey, errorMessage);
      }
    }, 100);

    return res.status(200).json(loadingMessage);
  } catch (error) {
    console.error("Error handling summarize command:", error);
    return res.status(500).json({ message: "Failed to process summarize command" });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const profile = await currentProfilePages(req);
    const { content, fileUrl } = req.body;
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
          
    if (!content) {
      return res.status(400).json({ error: "Content missing" });
    }

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

    const channel = await db.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: serverId as string,
      }
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const member = server.members.find((member) => member.profileId === profile.id);

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Check if this is a summarize command
    if (content.startsWith("/summarize")) {
      return await handleSummarizeCommand(content, channelId as string, serverId as string, channel, res);
    }

    const message = await db.message.create({
      data: {
        content,
        fileUrl,
        channelId: channelId as string,
        memberId: member.id,
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

    res?.socket?.server?.io?.emit(channelKey, message);

    return res.status(200).json(message);
  } catch (error) {
    console.log("[MESSAGES_POST]", error);
    return res.status(500).json({ message: "Internal Error" }); 
  }
}