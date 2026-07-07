// import dotenv from "dotenv";
// dotenv.config({ path: "../.env" });
import { OpenAI } from "openai";
import "dotenv/config";

const API_KEY = process.env.OPENAI_API_KEY;

const client = new OpenAI({
  apiKey: API_KEY,
});

async function main() {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "What is the capital of Sydney?" }],
  });
  console.log("🚀 ~ res:", response.choices[0].message.content);
}

main();
