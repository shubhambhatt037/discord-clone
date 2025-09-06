import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testGeminiKey() {
  try {
    console.log("🔍 Debug: All environment variables containing 'GEMINI':");
    Object.keys(process.env).filter(key => key.includes('GEMINI')).forEach(key => {
      console.log(`${key}: ${process.env[key]?.substring(0, 10)}...`);
    });
    
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("🔍 Debug: GEMINI_API_KEY value:", apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.log("❌ No API key found or still using placeholder");
      console.log("Please update GEMINI_API_KEY in your .env file");
      return;
    }

    console.log("🔑 Testing Gemini API key...");
    console.log("Key starts with:", apiKey.substring(0, 10) + "...");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent("Hello, this is a test. Please respond with 'API key is working!'");
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ API key is valid!");
    console.log("Response:", text);
  } catch (error) {
    console.log("❌ API key test failed:");
    console.error(error);
    
    if (error instanceof Error && error.message?.includes('API_KEY_INVALID')) {
      console.log("\n💡 Solutions:");
      console.log("1. Get a new API key from https://aistudio.google.com/app/apikey");
      console.log("2. Make sure you copied the complete key");
      console.log("3. Ensure the key has Generative AI API access enabled");
    }
  } finally {
    process.exit(0);
  }
}

testGeminiKey();