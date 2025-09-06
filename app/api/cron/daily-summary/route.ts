import { NextResponse } from "next/server";
import { generateDailySummaries } from "@/lib/daily-summary";

export async function POST(req: Request) {
  try {
    // Verify the request is from a cron service (optional security)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await generateDailySummaries();
    
    return NextResponse.json({ 
      success: true, 
      message: "Daily summaries generated successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[DAILY_SUMMARY_CRON]", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate daily summaries" },
      { status: 500 }
    );
  }
}

// Allow GET for testing purposes
export async function GET() {
  return NextResponse.json({ 
    message: "Daily summary cron endpoint",
    usage: "POST to trigger daily summary generation"
  });
}