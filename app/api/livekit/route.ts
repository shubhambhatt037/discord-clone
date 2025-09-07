import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");
  
  console.log("LiveKit API called with:", { room, username });
  
  if (!room) {
    console.error("Missing room parameter");
    return NextResponse.json(
      { error: 'Missing "room" query parameter' },
      { status: 400 }
    );
  } else if (!username) {
    console.error("Missing username parameter");
    return NextResponse.json(
      { error: 'Missing "username" query parameter' },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  console.log("LiveKit config:", { 
    apiKey: apiKey ? "✓" : "✗", 
    apiSecret: apiSecret ? "✓" : "✗", 
    wsUrl 
  });

  if (!apiKey || !apiSecret || !wsUrl) {
    console.error("LiveKit server misconfigured");
    return NextResponse.json(
      { error: "Server misconfigured", details: { apiKey: !!apiKey, apiSecret: !!apiSecret, wsUrl: !!wsUrl } },
      { status: 500 }
    );
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, { identity: username });
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });
    
    const token = at.toJwt();
    console.log("LiveKit token generated successfully");
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}