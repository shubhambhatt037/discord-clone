import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";

const AI_BOT_USER_ID = "ai-bot-system";
const AI_BOT_NAME = "AIBot";
const AI_BOT_IMAGE_URL = "https://cdn-icons-png.flaticon.com/512/4712/4712027.png"; // Robot icon

export async function ensureAIBotExists() {
  let botProfile = await db.profile.findUnique({
    where: { userId: AI_BOT_USER_ID }
  });

  if (!botProfile) {
    botProfile = await db.profile.create({
      data: {
        userId: AI_BOT_USER_ID,
        name: AI_BOT_NAME,
        imageUrl: AI_BOT_IMAGE_URL,
        email: "aibot@system.local",
        isBot: true,
      }
    });
  }

  return botProfile;
}

export async function ensureAIBotInServer(serverId: string) {
  const botProfile = await ensureAIBotExists();
  
  let botMember = await db.member.findFirst({
    where: {
      profileId: botProfile.id,
      serverId: serverId,
    }
  });

  if (!botMember) {
    botMember = await db.member.create({
      data: {
        profileId: botProfile.id,
        serverId: serverId,
        role: MemberRole.GUEST,
      }
    });
  }

  return botMember;
}

export async function getAIBotMember(serverId: string) {
  const botProfile = await db.profile.findUnique({
    where: { userId: AI_BOT_USER_ID }
  });

  if (!botProfile) return null;

  return await db.member.findFirst({
    where: {
      profileId: botProfile.id,
      serverId: serverId,
    },
    include: {
      profile: true,
    }
  });
}