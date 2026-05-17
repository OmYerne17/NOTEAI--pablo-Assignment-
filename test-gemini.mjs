import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function main() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say hello world in valid JSON { \"msg\": \"hello world\" }");
    console.log("Success:", result.response.text());
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
