import { NextResponse } from "next/server";
import { Message } from "@prisma/client";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { getAIBotMember, ensureAIBotInServer } from "@/lib/ai-bot";
import { generateSummary } from "@/lib/ai-service";
import { pusherServer } from "@/lib/pusher";

const MESSAGES_BATCH = 10;

export async function GET(
  req: Request
) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const channelId = searchParams.get("channelId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  
    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    let messages: Message[] = [];

    if (cursor) {
      messages = await db.message.findMany({
        take: MESSAGES_BATCH,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where: {
          channelId,
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
      })
    } else {
      messages = await db.message.findMany({
        take: MESSAGES_BATCH,
        where: {
          channelId,
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
    }

    let nextCursor = null;

    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1].id;
    }

    return NextResponse.json({
      items: messages,
      nextCursor
    });
  } catch (error) {
    console.log("[MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request
) {
  try {
    const profile = await currentProfile();
    const { content, fileUrl } = await req.json();
    const { searchParams } = new URL(req.url);

    const serverId = searchParams.get("serverId");
    const channelId = searchParams.get("channelId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!serverId) {
      return new NextResponse("Server ID missing", { status: 400 });
    }

    if (!channelId) {
      return new NextResponse("Channel ID missing", { status: 400 });
    }

    if (!content) {
      return new NextResponse("Content missing", { status: 400 });
    }

    const server = await db.server.findFirst({
      where: {
        id: serverId,
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
      return new NextResponse("Server not found", { status: 404 });
    }

    const channel = await db.channel.findFirst({
      where: {
        id: channelId,
        serverId: serverId,
      }
    });

    if (!channel) {
      return new NextResponse("Channel not found", { status: 404 });
    }

    const member = server.members.find((member) => member.profileId === profile.id);

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    // Check if this is an AI command
    if (content.startsWith('/summarize')) {
      // Process AI command
      await processAICommand(content, channelId, serverId, member);
      
      // Don't create a message for the command itself
      return NextResponse.json({ success: true, type: 'command' });
    }

    const message = await db.message.create({
      data: {
        content,
        fileUrl,
        channelId: channelId,
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

    // Trigger Pusher event for real-time updates
    const channelKey = `chat:${channelId}:messages`;
    await pusherServer.trigger(channelKey, "messages:new", message);

    return NextResponse.json(message);
  } catch (error) {
    console.log("[MESSAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

async function processAICommand(
  command: string, 
  channelId: string, 
  serverId: string, 
  requestingMember: any
) {
  try {
    if (command.startsWith('/summarize')) {
      // Ensure AI bot exists in the server
      await ensureAIBotInServer(serverId);
      const botMember = await getAIBotMember(serverId);
      
      if (!botMember) {
        console.error("Could not create or find AI bot member");
        return;
      }

      // Parse the count parameter (default to 20)
      const parts = command.trim().split(' ');
      const count = parts.length > 1 ? parseInt(parts[1]) || 20 : 20;
      const maxCount = Math.min(count, 100); // Limit to 100 messages

      // Get recent messages for summary
      const messages = await db.message.findMany({
        take: maxCount,
        where: {
          channelId,
          member: {
            profile: {
              isBot: false // Exclude bot messages
            }
          }
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

      if (messages.length === 0) {
        // Send "no messages" response
        const noMessagesResponse = await db.message.create({
          data: {
            content: "No recent messages found to summarize.",
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

        // Trigger Pusher event
        const channelKey = `chat:${channelId}:messages`;
        await pusherServer.trigger(channelKey, "messages:new", noMessagesResponse);
        return;
      }

      // Get channel info for context
      const channel = await db.channel.findUnique({
        where: { id: channelId }
      });

      // Generate AI summary
      const summary = await generateSummary(messages, channel?.name || "this channel");

      // Create bot response message
      const botMessage = await db.message.create({
        data: {
          content: `📋 **Summary of last ${messages.length} messages:**\n\n${summary}`,
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

      // Trigger Pusher event for real-time updates
      const channelKey = `chat:${channelId}:messages`;
      await pusherServer.trigger(channelKey, "messages:new", botMessage);
    }
  } catch (error) {
    console.error("Error processing AI command:", error);
    
    // Try to send error message if possible
    try {
      const botMember = await getAIBotMember(serverId);
      if (botMember) {
        const errorMessage = await db.message.create({
          data: {
            content: "Sorry, I encountered an error while processing your request. Please try again later.",
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
        await pusherServer.trigger(channelKey, "messages:new", errorMessage);
      }
    } catch (errorHandlingError) {
      console.error("Error handling AI command error:", errorHandlingError);
    }
  }
}