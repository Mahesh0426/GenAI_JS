import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "hey gemini?",
  });
  console.log(response.text);
}

main();
