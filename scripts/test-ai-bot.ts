import { ensureAIBotExists, getAIBotMember } from "@/lib/ai-bot";
import { db } from "@/lib/db";

async function testAIBot() {
  try {
    console.log("Testing AI Bot setup...");
    
    // Test bot profile creation
    const botProfile = await ensureAIBotExists();
    console.log("✓ AI Bot profile:", {
      id: botProfile.id,
      name: botProfile.name,
      isBot: botProfile.isBot
    });

    // Get a test server (first one)
    const server = await db.server.findFirst();
    if (!server) {
      console.log("No servers found. Create a server first to test bot membership.");
      return;
    }

    console.log(`Testing with server: ${server.name}`);

    // Test bot member creation
    const botMember = await getAIBotMember(server.id);
    if (botMember) {
      console.log("✓ AI Bot is already a member of this server");
    } else {
      console.log("AI Bot not found in server, this is expected for existing servers");
      console.log("Run the setup script: npx tsx scripts/setup-ai-bot.ts");
    }

    console.log("AI Bot test completed!");
  } catch (error) {
    console.error("Error testing AI Bot:", error);
  } finally {
    process.exit(0);
  }
}

testAIBot();