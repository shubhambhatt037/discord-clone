import { db } from "@/lib/db";
import { getAIBotMember } from "@/lib/ai-bot";
import { generateSummary } from "@/lib/ai-service";

export async function generateDailySummaries() {
  try {
    console.log("Starting daily summary generation...");
    
    // Get all text channels that had activity in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const activeChannels = await db.channel.findMany({
      where: {
        type: "TEXT",
        messages: {
          some: {
            createdAt: {
              gte: yesterday
            },
            deleted: false,
            member: {
              profile: {
                isBot: false // Exclude bot messages from activity check
              }
            }
          }
        }
      },
      include: {
        server: true,
        _count: {
          select: {
            messages: {
              where: {
                createdAt: {
                  gte: yesterday
                },
                deleted: false,
                member: {
                  profile: {
                    isBot: false
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log(`Found ${activeChannels.length} active channels`);

    for (const channel of activeChannels) {
      try {
        // Skip if less than 5 messages in the last 24 hours
        if (channel._count.messages < 5) {
          continue;
        }

        // Get AI bot member for this server
        const botMember = await getAIBotMember(channel.serverId);
        if (!botMember) {
          console.log(`No AI bot found for server ${channel.server.name}`);
          continue;
        }

        // Fetch messages from the last 24 hours
        const messages = await db.message.findMany({
          take: 100,
          where: {
            channelId: channel.id,
            deleted: false,
            createdAt: {
              gte: yesterday
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

        if (messages.length < 5) continue;

        // Generate summary
        const summaryContent = await generateSummary(messages, channel.name);

        // Create summary record
        await db.summary.create({
          data: {
            content: summaryContent,
            channelId: channel.id,
            messageCount: messages.length,
          }
        });

        // Post daily summary message
        await db.message.create({
          data: {
            content: `🌅 **Daily Summary** - ${new Date().toLocaleDateString()}\n\n${summaryContent}\n\n*This is an automated daily summary of the last 24 hours of activity.*`,
            channelId: channel.id,
            memberId: botMember.id,
          }
        });

        console.log(`✓ Generated daily summary for #${channel.name} in ${channel.server.name}`);
      } catch (error) {
        console.error(`✗ Failed to generate summary for channel ${channel.name}:`, error);
      }
    }

    console.log("Daily summary generation completed!");
  } catch (error) {
    console.error("Error generating daily summaries:", error);
  }
}

// Function to set up daily summary cron job (would need a cron service like Vercel Cron or similar)
export async function scheduleDailySummaries() {
  // This would typically be called by a cron job at midnight
  // For Vercel, you'd create an API route and use Vercel Cron
  // For other platforms, you'd use their respective cron services
  await generateDailySummaries();
}