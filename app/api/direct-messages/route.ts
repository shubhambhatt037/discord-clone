import { NextResponse } from "next/server";
import { DirectMessage } from "@prisma/client";

import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { getAIBotMember, ensureAIBotInServer } from "@/lib/ai-bot";
import { pusherServer } from "@/lib/pusher";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MESSAGES_BATCH = 10;

export async function GET(
  req: Request
) {
  try {
    const profile = await currentProfile();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const conversationId = searchParams.get("conversationId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  
    if (!conversationId) {
      return new NextResponse("Conversation ID missing", { status: 400 });
    }

    let messages: DirectMessage[] = [];

    if (cursor) {
      messages = await db.directMessage.findMany({
        take: MESSAGES_BATCH,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where: {
          conversationId,
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
      messages = await db.directMessage.findMany({
        take: MESSAGES_BATCH,
        where: {
          conversationId,
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
    console.log("[DIRECT_MESSAGES_GET]", error);
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

    const conversationId = searchParams.get("conversationId");

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!conversationId) {
      return new NextResponse("Conversation ID missing", { status: 400 });
    }

    if (!content) {
      return new NextResponse("Content missing", { status: 400 });
    }

    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          {
            memberOne: {
              profileId: profile.id,
            }
          },
          {
            memberTwo: {
              profileId: profile.id,
            }
          }
        ]
      },
      include: {
        memberOne: {
          include: {
            profile: true,
          }
        },
        memberTwo: {
          include: {
            profile: true,
          }
        }
      }
    });

    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 });
    }

    const member = conversation.memberOne.profileId === profile.id ? conversation.memberOne : conversation.memberTwo;

    if (!member) {
      return new NextResponse("Member not found", { status: 404 });
    }

    // Check if this is a conversation with the AI bot
    const otherMember = conversation.memberOne.profileId === profile.id ? conversation.memberTwo : conversation.memberOne;
    const isAIBotConversation = otherMember.profile.userId === "ai-bot-system";

    const message = await db.directMessage.create({
      data: {
        content,
        fileUrl,
        conversationId: conversationId,
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
    const conversationKey = `conversation:${conversationId}:messages`;
    await pusherServer.trigger(conversationKey, "messages:new", message);

    // If this is a conversation with AI bot, generate a response
    if (isAIBotConversation && !member.profile.isBot) {
      await generateAIResponse(content, conversationId, otherMember);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.log("[DIRECT_MESSAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

async function generateAIResponse(userMessage: string, conversationId: string, botMember: any) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Get recent conversation history for context
    const recentMessages = await db.directMessage.findMany({
      take: 10,
      where: {
        conversationId,
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

    // Format conversation history
    const conversationHistory = recentMessages
      .reverse()
      .slice(0, -1) // Exclude the current message
      .map(msg => `${msg.member.profile.isBot ? 'AI' : 'User'}: ${msg.content}`)
      .join('\n');

    const prompt = `
You are a helpful AI assistant in a Discord-like chat application. You're having a direct conversation with a user.

Previous conversation:
${conversationHistory}

User's latest message: ${userMessage}

Please respond in a helpful, friendly, and conversational manner. Keep your response concise but informative. You can:
- Answer questions
- Provide explanations
- Help with problems
- Have casual conversations
- Provide summaries if asked
- Give advice or suggestions

Respond naturally as if you're chatting with a friend.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Create AI bot response
    const botMessage = await db.directMessage.create({
      data: {
        content: aiResponse,
        conversationId: conversationId,
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
    const conversationKey = `conversation:${conversationId}:messages`;
    await pusherServer.trigger(conversationKey, "messages:new", botMessage);

  } catch (error) {
    console.error("Error generating AI response:", error);
    
    // Send error message
    try {
      const errorMessage = await db.directMessage.create({
        data: {
          content: "Sorry, I'm having trouble responding right now. Please try again later.",
          conversationId: conversationId,
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

      const conversationKey = `conversation:${conversationId}:messages`;
      await pusherServer.trigger(conversationKey, "messages:new", errorMessage);
    } catch (errorHandlingError) {
      console.error("Error handling AI response error:", errorHandlingError);
    }
  }
}