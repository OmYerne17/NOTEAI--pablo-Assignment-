import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hello!");
    console.log("gemini-2.0-flash success:", result.response.text());
  } catch (e: any) {
    console.error("gemini-2.0-flash failed:", e.message);
  }
}

test();
