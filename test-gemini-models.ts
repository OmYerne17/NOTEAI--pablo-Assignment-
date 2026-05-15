import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`);
    const data = await response.json();
    console.log("Models:", data.models?.map((m: any) => m.name).filter((n: string) => n.includes("gemini")).join(", "));
  } catch (e: any) {
    console.error("Failed to list models:", e.message);
  }
}

listModels();
