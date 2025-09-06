import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface MessageForSummary {
  id: string;
  content: string;
  member: {
    profile: {
      name: string;
      isBot: boolean;
    };
  };
  createdAt: Date;
}

export async function generateSummary(
  messages: MessageForSummary[],
  channelName: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Filter out bot messages and format for AI
    const humanMessages = messages
      .filter(msg => !msg.member.profile.isBot && msg.content.trim())
      .reverse() // Show chronological order
      .map(msg => `${msg.member.profile.name}: ${msg.content}`)
      .join('\n');

    if (!humanMessages.trim()) {
      return "No recent messages to summarize.";
    }

    const prompt = `
You are an AI assistant helping to summarize chat conversations. Please analyze the following chat messages from the "${channelName}" channel and provide a concise summary.

Chat Messages:
${humanMessages}

Please provide a summary in 3-5 bullet points that captures:
- Main topics discussed
- Key decisions or conclusions
- Important information shared
- Any action items mentioned

Format your response as bullet points using • symbol. Keep it concise and professional.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Sorry, I couldn't generate a summary at this time. Please try again later.";
  }
}