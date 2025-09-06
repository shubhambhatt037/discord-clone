import { db } from "@/lib/db";
import { ensureAIBotExists, ensureAIBotInServer } from "@/lib/ai-bot";

async function setupAIBotForExistingServers() {
  try {
    console.log("Setting up AI bot for existing servers...");
    
    // Ensure AI bot profile exists
    await ensureAIBotExists();
    console.log("✓ AI bot profile created/verified");

    // Get all servers
    const servers = await db.server.findMany({
      select: { id: true, name: true }
    });

    console.log(`Found ${servers.length} servers`);

    // Add AI bot to each server
    for (const server of servers) {
      try {
        await ensureAIBotInServer(server.id);
        console.log(`✓ Added AI bot to server: ${server.name}`);
      } catch (error) {
        console.error(`✗ Failed to add AI bot to server ${server.name}:`, error);
      }
    }

    console.log("AI bot setup completed!");
  } catch (error) {
    console.error("Error setting up AI bot:", error);
  } finally {
    process.exit(0);
  }
}

setupAIBotForExistingServers();